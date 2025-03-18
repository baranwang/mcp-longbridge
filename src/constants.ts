import { AdjustType, Period } from 'longport';
import { z } from 'zod';
import { parseNaiveDate, parseNaiveDatetime } from './utils';

export enum Tool {
    TradeAccountBalance = 'trade-account-balance',
    TradeStockPositions = 'trade-stock-positions',

    QuoteStaticInfo = 'quote-static-info',
    QuoteRealtimeInfo = 'quote-realtime-info',
    QuoteDepth = 'quote-depth',
    QuoteHistoryCandlesticks = 'quote-history-candlesticks',
}

export const ToolNameSchema = z.nativeEnum(Tool)

export const TradeAccountBalanceSchema = z.object({
    currency: z
        .union([z.literal('HKD'), z.literal('USD'), z.literal('CNH')])
        .optional()
        .describe('Currency'),
});

export const TradeStockPositionsSchema = z.object({
    symbol: z
        .array(z.string())
        .optional()
        .describe('Stock code, use ticker.region format, E.g:AAPL.US'),
});


export const QuoteStaticInfoSchema = z.object({
    symbol: z
        .array(z.string())
        .max(500, 'The maximum number of symbols in each request is 500')
        .describe('Stock code, use ticker.region format, E.g:AAPL.US'),
});

export const QuoteRealtimeInfoSchema = z.object({
    symbol: z
        .array(z.string())
        .max(500, 'The maximum number of symbols in each request is 500')
        .describe('Stock code, use ticker.region format, E.g:AAPL.US'),
});

export const QuoteDepthSchema = z.object({
    symbol: z.string()
        .describe('Stock code, use ticker.region format, E.g:AAPL.US'),
});


export const QuoteHistoryCandlesticksSchema = z.object({
    symbol: z.string()
        .describe('Stock code, use ticker.region format, E.g:AAPL.US'),
    period: z.union([
        z.union([z.literal(1), z.literal('1')]).describe('One Minute'),
        z.union([z.literal(2), z.literal('2')]).describe('Two Minutes'),
        z.union([z.literal(3), z.literal('3')]).describe('Three Minutes'),
        z.union([z.literal(5), z.literal('5')]).describe('Five Minutes'),
        z.union([z.literal(10), z.literal('10')]).describe('Ten Minutes'),
        z.union([z.literal(15), z.literal('15')]).describe('Fifteen Minutes'),
        z.union([z.literal(20), z.literal('20')]).describe('Twenty Minutes'),
        z.union([z.literal(30), z.literal('30')]).describe('Thirty Minutes'),
        z.union([z.literal(45), z.literal('45')]).describe('Forty Five Minutes'),
        z.union([z.literal(60), z.literal('60')]).describe('Sixty Minutes'),
        z.union([z.literal(120), z.literal('120')]).describe('Two Hours'),
        z.union([z.literal(180), z.literal('180')]).describe('Three Hours'),
        z.union([z.literal(240), z.literal('240')]).describe('Four Hours'),
        z.union([z.literal(1000), z.literal('1000')]).describe('One Day'),
        z.union([z.literal(2000), z.literal('2000')]).describe('One Week'),
        z.union([z.literal(3000), z.literal('3000')]).describe('One Month'),
        z.union([z.literal(3500), z.literal('3500')]).describe('One Quarter'),
        z.union([z.literal(4000), z.literal('4000')]).describe('One Year'),
    ]).transform(value => ({
        1: Period.Min_1,
        2: Period.Min_2,
        3: Period.Min_3,
        5: Period.Min_5,
        10: Period.Min_10,
        15: Period.Min_15,
        20: Period.Min_20,
        30: Period.Min_30,
        45: Period.Min_45,
        60: Period.Min_60,
        120: Period.Min_120,
        180: Period.Min_180,
        240: Period.Min_240,
        1000: Period.Day,
        2000: Period.Week,
        3000: Period.Month,
        3500: Period.Quarter,
        4000: Period.Year,
    }[value]))
        .describe('Candlestick period'),
    adjust_type: z.union([
        z.literal(0).describe('Actual'),
        z.literal(1).describe('Adjust forward'),
    ]).transform(value => ({
        0: AdjustType.NoAdjust,
        1: AdjustType.ForwardAdjust,
    })[value])
        .describe('Adjustment type'),
    query_type: z.union([
        z.literal(1).describe('Query by offset'),
        z.literal(2).describe('Query by date'),
    ]).describe('Query type'),
    date_request: z.object({
        start_date: z.string().describe('Date of query begin, in YYYYMMDD format, for example: 20231016'),
        end_date: z.string().describe('Date of query end, in YYYYMMDD format, for example: 20231016'),
    }).transform(value => ({
        start: parseNaiveDate(value.start_date),
        end: parseNaiveDate(value.end_date),
    })).optional().describe('Required when querying by date'),
    offset_request: z.object({
        direction: z.union([
            z.literal(0).describe('query in the direction of historical data'),
            z.literal(1).describe('query in the direction of latest data'),
        ]).describe('Query direction'),
        date: z.string().optional().describe('Query date, in YYYYMMDD format, for example: 20231016. Default value: latest trading day of the underlying market.'),
        minute: z.string().optional().describe('Query time, in HHMM format, for example: 09:35, only valid when querying minute-level data'),
        count: z.number().min(1).max(1000).optional().default(10).describe('Count of Candlesticks, valid range:[1,1000]. Default value: 10'),
    }).optional().transform(value => ({
        forward: value?.direction === 1,
        datetime: value?.date ? parseNaiveDatetime(value.date, value.minute) : undefined,
        count: value?.count,
    }))
        .describe('Required when querying by offset'),
}).refine(data => {
    if (data.query_type === 1 && !data.offset_request) {
        return false;
    }
    if (data.query_type === 2 && !data.date_request) {
        return false;
    }
    return true;
}, {
    path: ["query_type"]
})

