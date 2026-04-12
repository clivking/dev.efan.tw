import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPortalPassword, setPortalCookie, signPortalToken } from '@/lib/portal-auth';
import { getSetting } from '@/lib/settings';

function isPortalTokenExpired(expiresAt: Date | null): boolean {
    return !!expiresAt && expiresAt.getTime() < Date.now();
}

async function findCustomerByPortalToken(token: string) {
    return prisma.customer.findFirst({
        where: { portalToken: token },
        include: {
            companyNames: { where: { isPrimary: true }, take: 1 },
            contacts: {
                orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
                include: {
                    portalUser: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                            status: true,
                            lastLoginAt: true,
                        },
                    },
                },
            },
            portalUsers: true,
        },
    });
}

export async function POST(req: NextRequest) {
    try {
        const { token, contactId, username, password, confirmPassword, displayName } = await req.json();

        if (!token) {
            return NextResponse.json({ error: '缺少註冊 token，請使用有效的邀請連結。' }, { status: 400 });
        }

        const customer = await findCustomerByPortalToken(token);
        if (!customer || isPortalTokenExpired(customer.portalTokenExpires)) {
            return NextResponse.json({ error: '這個註冊連結已失效，請重新向一帆索取。' }, { status: 400 });
        }

        if (!contactId) {
            return NextResponse.json({ error: '請先選擇要申請帳號的聯絡人。' }, { status: 400 });
        }

        const contact = customer.contacts.find((item) => item.id === contactId);
        if (!contact) {
            return NextResponse.json({ error: '找不到這位聯絡人，請重新整理後再試。' }, { status: 400 });
        }

        if (contact.portalUser) {
            return NextResponse.json({ error: '這位聯絡人已經有 portal 帳號，請直接登入或洽一帆協助。' }, { status: 400 });
        }

        if (!username || !password || !displayName) {
            return NextResponse.json({ error: '請完整填寫顯示名稱、帳號與密碼。' }, { status: 400 });
        }

        if (!/^[a-zA-Z0-9_]{4,20}$/.test(username)) {
            return NextResponse.json({ error: '帳號需為 4 到 20 碼英數字或底線。' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: '密碼至少需要 6 碼。' }, { status: 400 });
        }

        if (password !== confirmPassword) {
            return NextResponse.json({ error: '兩次輸入的密碼不一致。' }, { status: 400 });
        }

        const existing = await prisma.portalUser.findUnique({ where: { username } });
        if (existing) {
            return NextResponse.json({ error: '這個帳號已被使用，請換一個帳號名稱。' }, { status: 400 });
        }

        const passwordHash = await hashPortalPassword(password);
        const user = await prisma.$transaction(async (tx) => {
            const created = await tx.portalUser.create({
                data: {
                    customerId: customer.id,
                    contactId: contact.id,
                    username,
                    passwordHash,
                    displayName,
                    status: 'active',
                },
            });

            await tx.customer.update({
                where: { id: customer.id },
                data: {
                    portalToken: null,
                    portalTokenExpires: null,
                },
            });

            return created;
        });

        const jwtToken = await signPortalToken({
            portalUserId: user.id,
            customerId: customer.id,
            username: user.username,
        });
        await setPortalCookie(jwtToken);

        const companyName = customer.companyNames[0]?.companyName || contact.name || '客戶入口';

        try {
            const telegramChatId = await getSetting('telegram_chat_id', '');
            const telegramBotToken = await getSetting('telegram_bot_token', '');
            if (telegramChatId && telegramBotToken) {
                const lines = [
                    '客戶入口完成註冊',
                    '------------------------',
                    `公司：${companyName}`,
                    `聯絡人：${contact.name}`,
                    `顯示名稱：${displayName}`,
                    `帳號：${username}`,
                    `註冊時間：${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`,
                ];

                await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: telegramChatId, text: lines.join('\n') }),
                });
            }
        } catch (error) {
            console.error('[Portal Register] Telegram notification failed:', error);
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                companyName,
                contactName: contact.name,
            },
        });
    } catch (error) {
        console.error('[Portal Register]', error);
        return NextResponse.json({ error: '建立 portal 帳號時發生錯誤，請稍後再試。' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const token = req.nextUrl.searchParams.get('token');
        if (!token) {
            return NextResponse.json({ error: '缺少註冊 token。' }, { status: 400 });
        }

        const customer = await findCustomerByPortalToken(token);
        if (!customer || isPortalTokenExpired(customer.portalTokenExpires)) {
            return NextResponse.json({ error: '這個註冊連結已失效，請重新向一帆索取。' }, { status: 400 });
        }

        return NextResponse.json({
            companyName: customer.companyNames[0]?.companyName || '',
            expiresAt: customer.portalTokenExpires?.toISOString() ?? null,
            contacts: customer.contacts.map((contact) => ({
                id: contact.id,
                name: contact.name,
                title: contact.title,
                email: contact.email,
                mobile: contact.mobile,
                isPrimary: contact.isPrimary,
                portalUser: contact.portalUser
                    ? {
                        id: contact.portalUser.id,
                        username: contact.portalUser.username,
                        displayName: contact.portalUser.displayName,
                        status: contact.portalUser.status,
                        lastLoginAt: contact.portalUser.lastLoginAt,
                    }
                    : null,
            })),
        });
    } catch (error) {
        console.error('[Portal Register Validate]', error);
        return NextResponse.json({ error: '驗證註冊連結時發生錯誤。' }, { status: 500 });
    }
}
