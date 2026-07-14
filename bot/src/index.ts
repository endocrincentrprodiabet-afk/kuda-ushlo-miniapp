import 'dotenv/config';
import { createServer } from 'node:http';
import { Bot, Keyboard } from 'grammy';

type CurrencyCode =
  | 'RUB'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'TRY'
  | 'CNY'
  | 'JPY'
  | 'KZT'
  | 'AED'
  | 'GEL';

type CurrencyConfig = {
  code: CurrencyCode;
  locale: string;
  symbol: string;
  fractionDigits: number;
};

const currencies: readonly CurrencyConfig[] = [
  { code: 'RUB', locale: 'ru-RU', symbol: '₽', fractionDigits: 0 },
  { code: 'USD', locale: 'en-US', symbol: '$', fractionDigits: 0 },
  { code: 'EUR', locale: 'de-DE', symbol: '€', fractionDigits: 0 },
  { code: 'GBP', locale: 'en-GB', symbol: '£', fractionDigits: 0 },
  { code: 'TRY', locale: 'tr-TR', symbol: '₺', fractionDigits: 0 },
  { code: 'CNY', locale: 'zh-CN', symbol: '¥', fractionDigits: 0 },
  { code: 'JPY', locale: 'ja-JP', symbol: '¥', fractionDigits: 0 },
  { code: 'KZT', locale: 'kk-KZ', symbol: '₸', fractionDigits: 0 },
  { code: 'AED', locale: 'ar-AE', symbol: 'د.إ', fractionDigits: 0 },
  { code: 'GEL', locale: 'ka-GE', symbol: '₾', fractionDigits: 0 },
] as const;

const currencyByCode = new Map<CurrencyCode, CurrencyConfig>(
  currencies.map((currency) => [currency.code, currency]),
);

type ExpenseReportPayload = {
  type: 'expense_report';
  version: 1;
  currency: CurrencyCode;
  period: 'today';
  generatedAt: string;
  todayTotal: number;
  weekTotal: number;
  dailyLimit: number;
  limitDiff: number;
  isLimitExceeded: boolean;
  categories: Array<{
    category: string;
    total: number;
  }>;
  recentExpenses: Array<{
    amount: number;
    category: string;
    note: string;
    date: string;
  }>;
};

const botToken = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEB_APP_URL;

if (!botToken) {
  throw new Error('BOT_TOKEN is required');
}

if (!webAppUrl) {
  throw new Error('WEB_APP_URL is required');
}

const bot = new Bot(botToken);

bot.command('start', async (ctx) => {
  console.log('Start command received');

  const keyboard = new Keyboard()
    .webApp('Открыть мини-бюджет', webAppUrl)
    .resized();

  await ctx.reply(
    'Куда ушло?\n\nМини-бюджет на каждый день. Открой приложение, чтобы добавить расход или отправить отчёт.',
    {
      reply_markup: keyboard,
    },
  );
});

bot.on('message:web_app_data', async (ctx) => {
  const rawData = ctx.message.web_app_data.data;
  const parsed = parseExpenseReport(rawData);

  if (!parsed.ok) {
    await ctx.reply(parsed.message);
    return;
  }

  await ctx.reply(formatExpenseReport(parsed.report));
});

bot.on('message', async (ctx) => {
  console.log('Message received:', ctx.message?.text);
});

bot.catch((error) => {
  console.error('Bot error:', error);
});

function startHttpServer() {
  const host = '0.0.0.0';
  const port = Number(process.env.PORT || 10000);

  const server = createServer((request, response) => {
    if (request.method === 'GET' && request.url === '/') {
      response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('kuda-ushlo-bot is running');
      return;
    }

    if (request.method === 'GET' && request.url === '/health') {
      response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('ok');
      return;
    }

    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('not found');
  });

  server.listen(port, host, () => {
    console.log(`HTTP server is listening on ${host}:${port}`);
  });
}


type ParseResult =
  | {
      ok: true;
      report: ExpenseReportPayload;
    }
  | {
      ok: false;
      message: string;
    };

function parseExpenseReport(rawData: string): ParseResult {
  let data: unknown;

  try {
    data = JSON.parse(rawData);
  } catch {
    return {
      ok: false,
      message: 'Не удалось прочитать отчёт. Данные из приложения пришли в неверном формате.',
    };
  }

  if (!isRecord(data)) {
    return {
      ok: false,
      message: 'Не удалось обработать отчёт. Ожидался объект с данными расходов.',
    };
  }

  if (data.type !== 'expense_report') {
    return {
      ok: false,
      message: 'Не удалось обработать отчёт. Приложение отправило неподдерживаемый тип данных.',
    };
  }

  const normalizedData = {
    ...data,
    currency: normalizeCurrencyCode(data.currency),
  };

  if (!isExpenseReportPayload(normalizedData)) {
    return {
      ok: false,
      message: 'Не удалось обработать отчёт. В данных расходов не хватает обязательных полей.',
    };
  }

  return {
    ok: true,
    report: normalizedData,
  };
}

function isExpenseReportPayload(value: Record<string, unknown>): value is ExpenseReportPayload {
  return (
    value.version === 1 &&
    isCurrencyCode(value.currency) &&
    value.period === 'today' &&
    typeof value.generatedAt === 'string' &&
    isFiniteNumber(value.todayTotal) &&
    isFiniteNumber(value.weekTotal) &&
    isFiniteNumber(value.dailyLimit) &&
    isFiniteNumber(value.limitDiff) &&
    typeof value.isLimitExceeded === 'boolean' &&
    Array.isArray(value.categories) &&
    value.categories.every(isCategoryTotal) &&
    Array.isArray(value.recentExpenses) &&
    value.recentExpenses.every(isRecentExpense)
  );
}

function isCategoryTotal(value: unknown): value is ExpenseReportPayload['categories'][number] {
  return (
    isRecord(value) &&
    typeof value.category === 'string' &&
    isFiniteNumber(value.total)
  );
}

function isRecentExpense(value: unknown): value is ExpenseReportPayload['recentExpenses'][number] {
  return (
    isRecord(value) &&
    isFiniteNumber(value.amount) &&
    typeof value.category === 'string' &&
    typeof value.note === 'string' &&
    typeof value.date === 'string'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && currencyByCode.has(value as CurrencyCode);
}

function normalizeCurrencyCode(value: unknown): CurrencyCode {
  return isCurrencyCode(value) ? value : 'RUB';
}

function formatExpenseReport(report: ExpenseReportPayload): string {
  const limitLabel = report.isLimitExceeded ? 'Превышение' : 'Осталось';
  const limitAmount = Math.abs(report.limitDiff);
  const categories = formatCategories(report);
  const recentExpenses = formatRecentExpenses(report);

  return [
    'Отчёт за сегодня',
    '',
    `Всего потрачено: ${formatMoney(report.todayTotal, report.currency)}`,
    `За неделю: ${formatMoney(report.weekTotal, report.currency)}`,
    `Дневной лимит: ${formatMoney(report.dailyLimit, report.currency)}`,
    `${limitLabel}: ${formatMoney(limitAmount, report.currency)}`,
    '',
    'Категории:',
    categories,
    '',
    'Последние расходы:',
    recentExpenses,
  ].join('\n');
}

function formatCategories(report: ExpenseReportPayload): string {
  if (report.categories.length === 0) {
    return 'Расходов по категориям пока нет';
  }

  return report.categories
    .map((item) => `${item.category} — ${formatMoney(item.total, report.currency)}`)
    .join('\n');
}

function formatRecentExpenses(report: ExpenseReportPayload): string {
  if (report.recentExpenses.length === 0) {
    return 'Последних расходов пока нет';
  }

  return report.recentExpenses
    .map((item) => {
      const note = item.note.trim();
      const noteSuffix = note ? `, ${note}` : '';

      return `${item.category} — ${formatMoney(item.amount, report.currency)}${noteSuffix}`;
    })
    .join('\n');
}

function formatMoney(amount: number, currency: CurrencyCode): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const safeCurrency = normalizeCurrencyCode(currency);
  const config = currencyByCode.get(safeCurrency) ?? currencyByCode.get('RUB')!;

  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: config.fractionDigits,
      maximumFractionDigits: config.fractionDigits,
    }).format(safeAmount);
  } catch {
    const parts = new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      currencyDisplay: 'code',
      minimumFractionDigits: config.fractionDigits,
      maximumFractionDigits: config.fractionDigits,
    }).formatToParts(safeAmount);

    return parts.map((part) => (part.type === 'currency' ? config.symbol : part.value)).join('');
  }
}
async function main() {
  console.log('Starting bot...');

  startHttpServer();

  const botInfo = await bot.api.getMe();
  console.log(`Bot connected: @${botInfo.username}`);

  await bot.start({
    onStart: () => console.log('Bot is running'),
  });
}

main().catch((error) => {
  console.error('Failed to start bot:', error);
});
