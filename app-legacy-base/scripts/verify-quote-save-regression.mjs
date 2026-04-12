import puppeteer from 'puppeteer';
import { PrismaClient } from '../src/generated/prisma-v7/index.js';

const prisma = new PrismaClient();
const BASE_URL = 'https://dev.efan.tw';
const USERNAME = 'cliv';
const PASSWORD = '0982';

async function login(page) {
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle2' });
  await page.type('input#username', USERNAME);
  await page.type('input#password', PASSWORD);
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
  ]);
}

async function createDraftQuote() {
  const customer = await prisma.customer.findFirst({
    where: { isDeleted: false },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      companyNames: { select: { id: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
      contacts: { select: { id: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
      locations: { select: { id: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
    },
  });

  if (!customer?.contacts[0]) throw new Error('No customer/contact available for quote regression test');

  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });

  if (!loginRes.ok) throw new Error(`Login API failed: ${loginRes.status}`);

  const cookie = loginRes.headers.getSetCookie().map((value) => value.split(';')[0]).join('; ');
  const createRes = await fetch(`${BASE_URL}/api/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({
      customerId: customer.id,
      companyNameId: customer.companyNames[0]?.id ?? null,
      contactIds: [customer.contacts[0].id],
      locationId: customer.locations[0]?.id ?? null,
      taxRate: 5,
    }),
  });

  if (!createRes.ok) throw new Error(`Create quote API failed: ${createRes.status}`);

  const quote = await createRes.json();
  return { quote, cookie };
}

async function deleteQuote(quoteId, cookie) {
  await fetch(`${BASE_URL}/api/quotes/${quoteId}`, {
    method: 'DELETE',
    headers: { cookie },
  });
}

async function getSaveButton(page) {
  const saveButton = await page.$('[data-testid="quote-save-button"]');
  if (!saveButton) throw new Error('Save button not found');
  return saveButton;
}

async function saveAndWait(page, matcher) {
  const saveButton = await getSaveButton(page);
  const disabled = await page.evaluate((el) => el.disabled, saveButton);
  if (disabled) throw new Error('Save button is disabled');

  await Promise.all([
    page.waitForResponse((resp) => matcher(resp) && resp.status() === 200),
    saveButton.click(),
  ]);
}

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    ignoreHTTPSErrors: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(60000);

  let cleanup = null;

  try {
    const { quote, cookie } = await createDraftQuote();
    cleanup = { quoteId: quote.id, cookie };
    const itemId = quote.items[0]?.id;
    const originalItemName = quote.items[0]?.name;
    if (!itemId || !originalItemName) throw new Error('Draft quote item missing');

    await login(page);
    await page.goto(`${BASE_URL}/admin/quotes/${quote.id}`, { waitUntil: 'networkidle2' });

    const completionNote = `回歸測試-${Date.now()}`;
    let completionTextarea = await page.$('[data-testid="completion-note-textarea"]');
    if (!completionTextarea) {
      const toggle = await page.$('[data-testid="completion-note-toggle"]');
      if (!toggle) throw new Error('Completion note toggle not found');
      await toggle.click();
      completionTextarea = await page.waitForSelector('[data-testid="completion-note-textarea"]');
    }
    if (!completionTextarea) throw new Error('Completion textarea not found');

    await completionTextarea.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await completionTextarea.type(completionNote);
    await saveAndWait(page, (resp) => resp.url().includes(`/api/quotes/${quote.id}`) && resp.request().method() === 'PUT');

    await page.reload({ waitUntil: 'networkidle2' });
    const persistedCompletion = await prisma.quote.findUnique({
      where: { id: quote.id },
      select: { completion_note: true },
    });
    if (persistedCompletion?.completion_note !== completionNote) {
      throw new Error(`Completion note mismatch: ${persistedCompletion?.completion_note}`);
    }

    const firstItemCell = await page.$(`[data-testid="quote-item-name-${itemId}"]`);
    if (!firstItemCell) throw new Error('First item cell not found');
    await firstItemCell.click();

    const itemInput = await page.waitForSelector(`[data-testid="quote-item-name-${itemId}"]`);
    const editedItemName = `${originalItemName}-測試`;
    await itemInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await itemInput.type(editedItemName);
    await page.keyboard.press('Tab');

    const beforeSave = await prisma.quoteItem.findUnique({
      where: { id: itemId },
      select: { name: true },
    });
    if (beforeSave?.name !== originalItemName) {
      throw new Error(`Item saved too early: ${beforeSave?.name}`);
    }

    await saveAndWait(page, (resp) => resp.url().includes(`/api/quotes/${quote.id}/items/${itemId}`) && resp.request().method() === 'PUT');

    const afterSave = await prisma.quoteItem.findUnique({
      where: { id: itemId },
      select: { name: true },
    });
    if (afterSave?.name !== editedItemName) {
      throw new Error(`Item did not save: ${afterSave?.name}`);
    }

    await page.reload({ waitUntil: 'networkidle2' });
    const renderedName = await page.$eval(`[data-testid="quote-item-name-${itemId}"]`, (el) => (el.textContent || '').trim());
    if (!renderedName.includes(editedItemName)) {
      throw new Error(`Rendered item mismatch: ${renderedName}`);
    }

    await prisma.quoteItem.update({
      where: { id: itemId },
      data: { name: originalItemName },
    });

    console.log('VERIFY_QUOTE_SAVE_OK');
  } finally {
    if (cleanup) {
      await deleteQuote(cleanup.quoteId, cleanup.cookie).catch(() => {});
    }
    await browser.close();
    await prisma.$disconnect();
  }
}

run().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
