import type { ServerResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { Config, QuoteContext, TradeContext } from 'longport';
import { ZodError, type z } from 'zod';
import { fromError } from 'zod-validation-error';
import {
  QuoteCalcIndexSchema,
  QuoteCapitalDistributionSchema,
  QuoteCapitalFlowSchema,
  QuoteDepthSchema,
  QuoteHistoryCandlesticksSchema,
  QuoteIntradaySchema,
  QuoteRealtimeInfoSchema,
  QuoteStaticInfoSchema,
  QuoteTradesSchema,
  TradeAccountBalanceSchema,
  TradeHistoryExecutionsSchema,
  TradeStockPositionsSchema,
  TradeTodayExecutionsSchema,
} from './constants';

export type ServerResult = z.infer<typeof ServerResultSchema>;

export class LongBridge {
  private _config?: Config;

  private tradeContext?: TradeContext;

  private quoteContext?: QuoteContext;

  private get config() {
    if (!this._config) {
      this._config = Config.fromEnv();
    }
    return this._config;
  }

  private async getTradeContext() {
    if (!this.tradeContext) {
      this.tradeContext = await TradeContext.new(this.config);
    }
    return this.tradeContext;
  }

  private async getQuoteContext() {
    if (!this.quoteContext) {
      this.quoteContext = await QuoteContext.new(this.config);
    }
    return this.quoteContext;
  }

  handleErrorResult(error: unknown): ServerResult {
    let errorMessage = '';
    if (error instanceof ZodError) {
      errorMessage = fromError(error).toString();
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = JSON.stringify(error);
    }
    return {
      content: [
        {
          type: 'text',
          text: errorMessage,
        },
      ],
      isError: true,
    };
  }

  handleSuccessResult(...result: unknown[]): ServerResult {
    return {
      content: result.map((item) => ({
        type: 'text',
        text: JSON.stringify(item),
      })),
    };
  }

  async quoteStaticInfo(args: unknown): Promise<ServerResult> {
    try {
      const params = QuoteStaticInfoSchema.parse(args);
      const quoteContext = await this.getQuoteContext();
      const staticInfo = await quoteContext.staticInfo(params.symbol);
      return this.handleSuccessResult(...staticInfo);
    } catch (error) {
      return this.handleErrorResult(error);
    }
  }

  async quoteRealtimeInfo(args: unknown): Promise<ServerResult> {
    try {
      const params = QuoteRealtimeInfoSchema.parse(args);
      const quoteContext = await this.getQuoteContext();
      const realtimeInfo = await quoteContext.quote(params.symbol);
      return this.handleSuccessResult(...realtimeInfo);
    } catch (error) {
      return this.handleErrorResult(error);
    }
  }

  async quoteDepth(args: unknown): Promise<ServerResult> {
    try {
      const params = QuoteDepthSchema.parse(args);
      const quoteContext = await this.getQuoteContext();
      const depth = await quoteContext.depth(params.symbol);
      return this.handleSuccessResult(depth);
    } catch (error) {
      return this.handleErrorResult(error);
    }
  }

  async quoteTrades(args: unknown): Promise<ServerResult> {
    try {
      const params = QuoteTradesSchema.parse(args);
      const quoteContext = await this.getQuoteContext();
      const trades = await quoteContext.trades(params.symbol, params.count);
      return this.handleSuccessResult(...trades);
    } catch (error) {
      return this.handleErrorResult(error);
    }
  }

  async quoteIntraday(args: unknown): Promise<ServerResult> {
    try {
      const params = QuoteIntradaySchema.parse(args);
      const quoteContext = await this.getQuoteContext();
      const intraday = await quoteContext.intraday(params.symbol);
      return this.handleSuccessResult(intraday);
    } catch (error) {
      return this.handleErrorResult(error);
    }
  }

  async quoteHistoryCandlesticks(args: unknown): Promise<ServerResult> {
    try {
      const params = QuoteHistoryCandlesticksSchema.parse(args);
      const quoteContext = await this.getQuoteContext();
      let historyCandlesticksPromise:
        | ReturnType<typeof quoteContext.historyCandlesticksByDate>
        | ReturnType<typeof quoteContext.historyCandlesticksByOffset>;
      if (params.query_type === 1) {
        historyCandlesticksPromise = quoteContext.historyCandlesticksByOffset(
          params.symbol,
          params.period,
          params.adjust_type,
          params.offset_request?.forward,
          params.offset_request?.datetime,
          params.offset_request?.count ?? 10,
        );
      } else {
        historyCandlesticksPromise = quoteContext.historyCandlesticksByDate(
          params.symbol,
          params.period,
          params.adjust_type,
          params.date_request?.start,
          params.date_request?.end,
        );
      }
      const historyCandlesticks = await historyCandlesticksPromise;
      return this.handleSuccessResult(historyCandlesticks);
    } catch (error) {
      return this.handleErrorResult(error);
    }
  }

  async quoteCapitalFlow(args: unknown): Promise<ServerResult> {
    try {
      const params = QuoteCapitalFlowSchema.parse(args);
      const quoteContext = await this.getQuoteContext();
      const capitalFlow = await quoteContext.capitalFlow(params.symbol);
      return this.handleSuccessResult(capitalFlow);
    } catch (error) {
      return this.handleErrorResult(error);
    }
  }

  async quoteCapitalDistribution(args: unknown): Promise<ServerResult> {
    try {
      const params = QuoteCapitalDistributionSchema.parse(args);
      const quoteContext = await this.getQuoteContext();
      const capitalDistribution = await quoteContext.capitalDistribution(params.symbol);
      return this.handleSuccessResult(capitalDistribution);
    } catch (error) {
      return this.handleErrorResult(error);
    }
  }

  async quoteCalcIndex(args: unknown): Promise<ServerResult> {
    try {
      const params = QuoteCalcIndexSchema.parse(args);
      const quoteContext = await this.getQuoteContext();
      const calcIndexes = await quoteContext.calcIndexes(params.symbols, params.calc_index);
      return this.handleSuccessResult(calcIndexes);
    } catch (error) {
      return this.handleErrorResult(error);
    }
  }

  async quoteWatchList(args: unknown): Promise<ServerResult> {
    try {
      const quoteContext = await this.getQuoteContext();
      const watchListGroup = await quoteContext.watchlist();
      return this.handleSuccessResult(...watchListGroup);
    } catch (error) {
      return this.handleErrorResult(error);
    }
  }

  async tradeHistoryExecutions(args: unknown): Promise<ServerResult> {
    try {
      const params = TradeHistoryExecutionsSchema.parse(args);
      const tradeContext = await this.getTradeContext();
      const historyExecutions = await tradeContext.historyExecutions(params);
      return this.handleSuccessResult(...historyExecutions);
    } catch (error) {
      return this.handleErrorResult(error);
    }
  }

  async tradeTodayExecutions(args: unknown): Promise<ServerResult> {
    try {
      const params = TradeTodayExecutionsSchema.parse(args);
      const tradeContext = await this.getTradeContext();
      const todayExecutions = await tradeContext.todayExecutions(params);
      return this.handleSuccessResult(...todayExecutions);
    } catch (error) {
      return this.handleErrorResult(error);
    }
  }

  async tradeAccountBalance(args: unknown): Promise<ServerResult> {
    try {
      const params = TradeAccountBalanceSchema.parse(args);
      const tradeContext = await this.getTradeContext();
      const accountBalance = await tradeContext.accountBalance(params.currency);
      return this.handleSuccessResult(...accountBalance);
    } catch (error) {
      return this.handleErrorResult(error);
    }
  }

  async tradeStockPositions(args: unknown): Promise<ServerResult> {
    try {
      const params = TradeStockPositionsSchema.parse(args);
      const tradeContext = await this.getTradeContext();
      const stockPositions = await tradeContext.stockPositions(params.symbol);
      return this.handleSuccessResult(...stockPositions.channels);
    } catch (error) {
      return this.handleErrorResult(error);
    }
  }
}
