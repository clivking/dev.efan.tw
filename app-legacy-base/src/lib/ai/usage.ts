import { prisma } from '@/lib/prisma';

export type AIUsageEventInput = {
  source: string;
  provider?: string | null;
  model?: string | null;
  inputTokens: number;
  outputTokens: number;
  estimatedCost?: number;
  messageCount?: number;
  relatedChatMessageId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: Date;
};

type UsageBucket = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  messageCount: number;
};

type AIUsageSummary = {
  today: UsageBucket;
  thisMonth: UsageBucket;
  lastMonth: UsageBucket;
  lifetime: UsageBucket;
  lastEventAt: string | null;
};

let usageStorageReady: Promise<void> | null = null;

async function initializeAIUsageStorage() {
  await prisma.$executeRawUnsafe(`
    INSERT INTO ai_usage_events (
      source,
      provider,
      model,
      input_tokens,
      output_tokens,
      total_tokens,
      estimated_cost,
      message_count,
      related_chat_message_id,
      metadata,
      created_at
    )
    SELECT
      'chat_reply',
      cm.provider,
      cm.model,
      COALESCE(cm.prompt_tokens, 0),
      COALESCE(cm.completion_tokens, 0),
      COALESCE(cm.total_tokens, 0),
      COALESCE(cm.estimated_cost, 0),
      1,
      cm.id,
      jsonb_build_object('backfilled', true),
      cm.created_at
    FROM chat_messages cm
    WHERE cm.role = 'assistant'
      AND cm.total_tokens IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM ai_usage_events e
        WHERE e.related_chat_message_id = cm.id
      )
  `);
}

export async function prepareAIUsageStorage() {
  if (!usageStorageReady) {
    usageStorageReady = initializeAIUsageStorage().catch((error) => {
      usageStorageReady = null;
      throw error;
    });
  }

  await usageStorageReady;
}

export async function recordAIUsageEvent(event: AIUsageEventInput) {
  await prepareAIUsageStorage();

  const inputTokens = Math.max(0, Number(event.inputTokens || 0));
  const outputTokens = Math.max(0, Number(event.outputTokens || 0));
  const totalTokens = inputTokens + outputTokens;
  const estimatedCost = Number(event.estimatedCost || 0);
  const messageCount = Math.max(1, Number(event.messageCount || 1));
  const createdAt = event.createdAt || new Date();
  const metadata = event.metadata ? JSON.parse(JSON.stringify(event.metadata)) : undefined;

  await prisma.aIUsageEvent.create({
    data: {
      source: event.source,
      provider: event.provider || null,
      model: event.model || null,
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCost,
      messageCount,
      relatedChatMessageId: event.relatedChatMessageId || null,
      metadata,
      createdAt,
    },
  });
}

function toBucket(row: Record<string, unknown>, prefix: string): UsageBucket {
  return {
    inputTokens: Number(row[`${prefix}InputTokens`] || 0),
    outputTokens: Number(row[`${prefix}OutputTokens`] || 0),
    totalTokens: Number(row[`${prefix}TotalTokens`] || 0),
    estimatedCost: Number(row[`${prefix}EstimatedCost`] || 0),
    messageCount: Number(row[`${prefix}MessageCount`] || 0),
  };
}

export async function getAIUsageSummary(): Promise<AIUsageSummary> {
  await prepareAIUsageStorage();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    SELECT
      COALESCE(SUM(input_tokens) FILTER (WHERE created_at >= ${todayStart}), 0)::int AS "todayInputTokens",
      COALESCE(SUM(output_tokens) FILTER (WHERE created_at >= ${todayStart}), 0)::int AS "todayOutputTokens",
      COALESCE(SUM(total_tokens) FILTER (WHERE created_at >= ${todayStart}), 0)::int AS "todayTotalTokens",
      COALESCE(SUM(estimated_cost) FILTER (WHERE created_at >= ${todayStart}), 0)::numeric AS "todayEstimatedCost",
      COALESCE(SUM(message_count) FILTER (WHERE created_at >= ${todayStart}), 0)::int AS "todayMessageCount",

      COALESCE(SUM(input_tokens) FILTER (WHERE created_at >= ${monthStart}), 0)::int AS "thisMonthInputTokens",
      COALESCE(SUM(output_tokens) FILTER (WHERE created_at >= ${monthStart}), 0)::int AS "thisMonthOutputTokens",
      COALESCE(SUM(total_tokens) FILTER (WHERE created_at >= ${monthStart}), 0)::int AS "thisMonthTotalTokens",
      COALESCE(SUM(estimated_cost) FILTER (WHERE created_at >= ${monthStart}), 0)::numeric AS "thisMonthEstimatedCost",
      COALESCE(SUM(message_count) FILTER (WHERE created_at >= ${monthStart}), 0)::int AS "thisMonthMessageCount",

      COALESCE(SUM(input_tokens) FILTER (WHERE created_at >= ${lastMonthStart} AND created_at <= ${lastMonthEnd}), 0)::int AS "lastMonthInputTokens",
      COALESCE(SUM(output_tokens) FILTER (WHERE created_at >= ${lastMonthStart} AND created_at <= ${lastMonthEnd}), 0)::int AS "lastMonthOutputTokens",
      COALESCE(SUM(total_tokens) FILTER (WHERE created_at >= ${lastMonthStart} AND created_at <= ${lastMonthEnd}), 0)::int AS "lastMonthTotalTokens",
      COALESCE(SUM(estimated_cost) FILTER (WHERE created_at >= ${lastMonthStart} AND created_at <= ${lastMonthEnd}), 0)::numeric AS "lastMonthEstimatedCost",
      COALESCE(SUM(message_count) FILTER (WHERE created_at >= ${lastMonthStart} AND created_at <= ${lastMonthEnd}), 0)::int AS "lastMonthMessageCount",

      COALESCE(SUM(input_tokens), 0)::int AS "lifetimeInputTokens",
      COALESCE(SUM(output_tokens), 0)::int AS "lifetimeOutputTokens",
      COALESCE(SUM(total_tokens), 0)::int AS "lifetimeTotalTokens",
      COALESCE(SUM(estimated_cost), 0)::numeric AS "lifetimeEstimatedCost",
      COALESCE(SUM(message_count), 0)::int AS "lifetimeMessageCount",
      MAX(created_at) AS "lastEventAt"
    FROM ai_usage_events
  `;

  const row = rows[0] || {};

  return {
    today: toBucket(row, 'today'),
    thisMonth: toBucket(row, 'thisMonth'),
    lastMonth: toBucket(row, 'lastMonth'),
    lifetime: toBucket(row, 'lifetime'),
    lastEventAt: row.lastEventAt ? new Date(String(row.lastEventAt)).toISOString() : null,
  };
}
