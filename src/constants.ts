import { AdjustType, CalcIndex, Period } from 'longport';
import { z } from 'zod';
import type { LongBridge } from './api';
import { parseNaiveDate, parseNaiveDatetime } from './utils';

export enum Tool {
  QuoteStaticInfo = 'quote-static-info',
  QuoteRealtimeInfo = 'quote-realtime-info',
  QuoteDepth = 'quote-depth',
  QuoteTrades = 'quote-trades',
  QuoteIntraday = 'quote-intraday',
  QuoteHistoryCandlesticks = 'quote-history-candlesticks',
  QuoteCapitalFlow = 'quote-capital-flow',
  QuoteCapitalDistribution = 'quote-capital-distribution',
  QuoteCalcIndex = 'quote-calc-index',
  QuoteWatchList = 'quote-watch-list',

  TradeHistoryExecutions = 'trade-history-executions',
  TradeTodayExecutions = 'trade-today-executions',
  TradeAccountBalance = 'trade-account-balance',
  TradeStockPositions = 'trade-stock-positions',
}

export const ToolNameSchema = z.nativeEnum(Tool);

export const SymbolSchema = z
  .string()
  .regex(/^[A-Z0-9]+\.[A-Z]+$/, 'Symbol must be in the format of "ticker.region"')
  .describe('Stock code, use ticker.region format, E.g:AAPL.US');

export const QuoteStaticInfoSchema = z.object({
  symbol: z
    .array(SymbolSchema)
    .max(500, 'The maximum number of symbols in each request is 500')
    .describe('Stock code, use ticker.region format, E.g:AAPL.US'),
});

export const QuoteRealtimeInfoSchema = z.object({
  symbol: z
    .array(SymbolSchema)
    .max(500, 'The maximum number of symbols in each request is 500')
    .describe('Stock code, use ticker.region format, E.g:AAPL.US'),
});

export const QuoteDepthSchema = z.object({
  symbol: SymbolSchema,
});

export const QuoteTradesSchema = z.object({
  symbol: SymbolSchema,
  count: z.number().int().min(1).max(1000).describe('Count of trades'),
});

export const QuoteIntradaySchema = z.object({
  symbol: SymbolSchema,
});

export const QuoteHistoryCandlesticksSchema = z
  .object({
    symbol: SymbolSchema,
    period: z
      .union([
        z.literal(Period.Min_1).describe('One Minute'),
        z.literal(Period.Min_2).describe('Two Minutes'),
        z.literal(Period.Min_3).describe('Three Minutes'),
        z.literal(Period.Min_5).describe('Five Minutes'),
        z.literal(Period.Min_10).describe('Ten Minutes'),
        z.literal(Period.Min_15).describe('Fifteen Minutes'),
        z.literal(Period.Min_20).describe('Twenty Minutes'),
        z.literal(Period.Min_30).describe('Thirty Minutes'),
        z.literal(Period.Min_45).describe('Forty Five Minutes'),
        z.literal(Period.Min_60).describe('Sixty Minutes'),
        z.literal(Period.Min_120).describe('Two Hours'),
        z.literal(Period.Min_180).describe('Three Hours'),
        z.literal(Period.Min_240).describe('Four Hours'),
        z.literal(Period.Day).describe('One Day'),
        z.literal(Period.Week).describe('One Week'),
        z.literal(Period.Month).describe('One Month'),
        z.literal(Period.Quarter).describe('One Quarter'),
        z.literal(Period.Year).describe('One Year'),
      ])
      .describe('Candlestick period'),
    adjust_type: z
      .union([
        z.literal(AdjustType.NoAdjust).describe('Actual'),
        z.literal(AdjustType.ForwardAdjust).describe('Adjust forward'),
      ])
      .describe('Adjustment type'),
    query_type: z
      .union([z.literal(1).describe('Query by offset'), z.literal(2).describe('Query by date')])
      .describe('Query type'),
    date_request: z
      .object({
        start_date: z.string().describe('Date of query begin, in YYYYMMDD format, for example: 20231016'),
        end_date: z.string().describe('Date of query end, in YYYYMMDD format, for example: 20231016'),
      })
      .transform((value) => ({
        start: parseNaiveDate(value.start_date),
        end: parseNaiveDate(value.end_date),
      }))
      .optional()
      .describe('Required when querying by date'),
    offset_request: z
      .object({
        direction: z
          .union([
            z.literal(0).describe('query in the direction of historical data'),
            z.literal(1).describe('query in the direction of latest data'),
          ])
          .describe('Query direction'),
        date: z
          .string()
          .optional()
          .describe(
            'Query date, in YYYYMMDD format, for example: 20231016. Default value: latest trading day of the underlying market.',
          ),
        minute: z
          .string()
          .optional()
          .describe('Query time, in HHMM format, for example: 09:35, only valid when querying minute-level data'),
        count: z
          .number()
          .int()
          .min(1)
          .max(1000)
          .optional()
          .default(10)
          .describe('Count of Candlesticks, valid range:[1,1000]. Default value: 10'),
      })
      .optional()
      .transform((value) => ({
        forward: value?.direction === 1,
        datetime: value?.date ? parseNaiveDatetime(value.date, value.minute) : undefined,
        count: value?.count,
      }))
      .describe('Required when querying by offset'),
  })
  .refine(
    (data) => {
      if (data.query_type === 1 && !data.offset_request) {
        return false;
      }
      if (data.query_type === 2 && !data.date_request) {
        return false;
      }
      return true;
    },
    {
      path: ['query_type'],
    },
  );

export const QuoteCapitalFlowSchema = z.object({
  symbol: SymbolSchema,
});

export const QuoteCapitalDistributionSchema = z.object({
  symbol: SymbolSchema,
});

export const QuoteCalcIndexSchema = z.object({
  symbols: z.array(SymbolSchema).max(500, 'The maximum number of symbols in each request is 500'),
  calc_index: z.array(
    z
      .union([
        z.literal(CalcIndex.LastDone).describe('Latest price'),
        z.literal(CalcIndex.ChangeValue).describe('Change value'),
        z.literal(CalcIndex.ChangeRate).describe('Change ratio'),
        z.literal(CalcIndex.Volume).describe('Volume'),
        z.literal(CalcIndex.Turnover).describe('Turnover'),
        z.literal(CalcIndex.YtdChangeRate).describe('Year-to-date change ratio, Except Option, Warrant'),
        z.literal(CalcIndex.TurnoverRate).describe('Turnover rate, Except Option, Warrant'),
        z.literal(CalcIndex.TotalMarketValue).describe('Total market value, Except Option, Warrant'),
        z.literal(CalcIndex.CapitalFlow).describe('Capital flow, Except Option, Warrant'),
        z.literal(CalcIndex.Amplitude).describe('Amplitude, Except Option, Warrant'),
        z.literal(CalcIndex.VolumeRatio).describe('Volume ratio, Except Option, Warrant'),
        z.literal(CalcIndex.PeTtmRatio).describe('PE (TTM), Except Option, Warrant'),
        z.literal(CalcIndex.PbRatio).describe('PB, Except Option, Warrant'),
        z.literal(CalcIndex.DividendRatioTtm).describe('Dividend ratio (TTM), Except Option, Warrant'),
        z.literal(CalcIndex.FiveDayChangeRate).describe('Five days change ratio, Except Option, Warrant'),
        z.literal(CalcIndex.TenDayChangeRate).describe('Ten days change ratio, Except Option, Warrant'),
        z.literal(CalcIndex.HalfYearChangeRate).describe('Half year change ratio, Except Option, Warrant'),
        z.literal(CalcIndex.FiveMinutesChangeRate).describe('Five minutes change ratio, Except Option, Warrant'),
        z.literal(CalcIndex.ExpiryDate).describe('Expiry date, Only Option, Warrant'),
        z.literal(CalcIndex.StrikePrice).describe('Strike Price, Only Option, Warrant'),
        z.literal(CalcIndex.UpperStrikePrice).describe('Upper bound price, Only Warrant'),
        z.literal(CalcIndex.LowerStrikePrice).describe('Lower bound price, Only Warrant'),
        z.literal(CalcIndex.OutstandingQty).describe('Outstanding quantity, Only Warrant'),
        z.literal(CalcIndex.OutstandingRatio).describe('Outstanding ratio, Only Warrant'),
        z.literal(CalcIndex.Premium).describe('Premium, Only Option, Warrant'),
        z.literal(CalcIndex.ItmOtm).describe('In/out of the bound, Only Warrant'),
        z.literal(CalcIndex.ImpliedVolatility).describe('Implied volatility, Only Option, Warrant'),
        z.literal(CalcIndex.WarrantDelta).describe('Warrant delta, Only Warrant'),
        z.literal(CalcIndex.CallPrice).describe('Call price, Only Warrant'),
        z.literal(CalcIndex.ToCallPrice).describe('Price interval from the call price, Only Warrant'),
        z.literal(CalcIndex.EffectiveLeverage).describe('Effective leverage, Only Warrant'),
        z.literal(CalcIndex.LeverageRatio).describe('Leverage ratio, Only Warrant'),
        z.literal(CalcIndex.ConversionRatio).describe('Conversion ratio, Only Warrant'),
        z.literal(CalcIndex.BalancePoint).describe('Breakeven point, Only Warrant'),
        z.literal(CalcIndex.OpenInterest).describe('Open interest, Only Option'),
        z.literal(CalcIndex.Delta).describe('Delta, Only Option'),
        z.literal(CalcIndex.Gamma).describe('Gamma, Only Option'),
        z.literal(CalcIndex.Theta).describe('Theta, Only Option'),
        z.literal(CalcIndex.Vega).describe('Vega, Only Option'),
        z.literal(CalcIndex.Rho).describe('Rho, Only Option'),
      ])
      .describe('Calc indexes'),
  ),
});

export const QuoteWatchListSchema = z.object({});

export const TradeHistoryExecutionsSchema = z.object({
  symbol: SymbolSchema.optional(),
  startAt: z
    .string()
    .datetime()
    .optional()
    .transform((value) => (value ? new Date(value) : undefined))
    .describe('Start time, in ISO 8601 format'),
  endAt: z
    .string()
    .datetime()
    .optional()
    .transform((value) => (value ? new Date(value) : undefined))
    .describe('End time, in ISO 8601 format'),
});

export const TradeTodayExecutionsSchema = z.object({
  symbol: SymbolSchema.optional(),
  orderId: z.string().optional().describe('Order ID'),
});

export const TradeAccountBalanceSchema = z.object({
  currency: z
    .union([z.literal('HKD'), z.literal('USD'), z.literal('CNH')])
    .optional()
    .describe('Currency'),
});

export const TradeStockPositionsSchema = z.object({
  symbol: z.array(SymbolSchema).optional().describe('Stock code, use ticker.region format, E.g:AAPL.US'),
});

export const TOOLS_CONFIG: Record<
  Tool,
  {
    description: string;
    zodSchema: z.ZodSchema<unknown>;
    funcName: keyof LongBridge;
  }
> = {
  [Tool.QuoteStaticInfo]: {
    description: 'This API is used to obtain the basic information of securities.',
    zodSchema: QuoteStaticInfoSchema,
    funcName: 'quoteStaticInfo',
  },
  [Tool.QuoteRealtimeInfo]: {
    description: 'This API is used to obtain the real-time quotes of securities, and supports all types of securities.',
    zodSchema: QuoteRealtimeInfoSchema,
    funcName: 'quoteRealtimeInfo',
  },
  [Tool.QuoteDepth]: {
    description: 'This API is used to obtain the depth data of security.',
    zodSchema: QuoteDepthSchema,
    funcName: 'quoteDepth',
  },
  [Tool.QuoteTrades]: {
    description: 'This API is used to obtain the trades data of security.',
    zodSchema: QuoteTradesSchema,
    funcName: 'quoteTrades',
  },
  [Tool.QuoteIntraday]: {
    description: 'This API is used to obtain the intraday data of security.',
    zodSchema: QuoteIntradaySchema,
    funcName: 'quoteIntraday',
  },
  [Tool.QuoteHistoryCandlesticks]: {
    description: 'This API is used to obtain the history candlestick data of security.',
    zodSchema: QuoteHistoryCandlesticksSchema,
    funcName: 'quoteHistoryCandlesticks',
  },
  [Tool.QuoteCapitalFlow]: {
    description: 'This API is used to obtain the daily capital flow intraday of security.',
    zodSchema: QuoteCapitalFlowSchema,
    funcName: 'quoteCapitalFlow',
  },
  [Tool.QuoteCapitalDistribution]: {
    description: 'This API is used to obtain the daily capital distribution of security.',
    zodSchema: QuoteCapitalDistributionSchema,
    funcName: 'quoteCapitalDistribution',
  },
  [Tool.QuoteCalcIndex]: {
    description: 'This API is used to obtain the calculate indexes of securities.',
    zodSchema: QuoteCalcIndexSchema,
    funcName: 'quoteCalcIndex',
  },
  [Tool.QuoteWatchList]: {
    description: 'Get watched list',
    zodSchema: QuoteWatchListSchema,
    funcName: 'quoteWatchList',
  },

  [Tool.TradeHistoryExecutions]: {
    description: 'This API is used to get history executions, including the sell and buy records.',
    zodSchema: TradeHistoryExecutionsSchema,
    funcName: 'tradeHistoryExecutions',
  },
  [Tool.TradeTodayExecutions]: {
    description: 'This API is used to get today executions.',
    zodSchema: TradeTodayExecutionsSchema,
    funcName: 'tradeTodayExecutions',
  },

  [Tool.TradeAccountBalance]: {
    description:
      'The API is used to obtain the available, desirable, frozen, to-be-settled, and in-transit funds (fund purchase and redemption) information for each currency of the user.',
    zodSchema: TradeAccountBalanceSchema,
    funcName: 'tradeAccountBalance',
  },
  [Tool.TradeStockPositions]: {
    description:
      'The API is used to obtain stock position information including account, stock code, number of shares held, number of available shares, average position price (calculated according to account settings), and currency.',
    zodSchema: TradeStockPositionsSchema,
    funcName: 'tradeStockPositions',
  },
};
