import type { ServerResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { Config, QuoteContext, TradeContext } from "longport";
import { ZodError, type z } from "zod";
import { QuoteDepthSchema, QuoteHistoryCandlesticksSchema, QuoteRealtimeInfoSchema, QuoteStaticInfoSchema, TradeAccountBalanceSchema, TradeStockPositionsSchema } from "./constants";
import { fromError } from "zod-validation-error";

export type ServerResult = z.infer<typeof ServerResultSchema>;

export class LongBridge {
  private _config?: Config;

  private tradeContext?: TradeContext;

  private quoteContext?: QuoteContext

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
      content: [{
        type: 'text',
        text: errorMessage
      }],
      isError: true,
    }
  }

  async tradeAccountBalance(args: unknown): Promise<ServerResult> {
    try {
      const params = TradeAccountBalanceSchema.parse(args);
      const tradeContext = await this.getTradeContext();
      const accountBalance = await tradeContext.accountBalance(params.currency)
      return {
        content: accountBalance.map(item => ({
          type: 'text',
          text: JSON.stringify(item)
        }))
      }
    } catch (error) {
      return this.handleErrorResult(error);
    }
  }

  async tradeStockPositions(args: unknown): Promise<ServerResult> {
    try {
      const params = TradeStockPositionsSchema.parse(args);
      const tradeContext = await this.getTradeContext();
      const stockPositions = await tradeContext.stockPositions(params.symbol)
      return {
        content: stockPositions.channels.map(item => ({
          type: 'text',
          text: JSON.stringify(item)
        }))
      }
    } catch (error) {
      return this.handleErrorResult(error);
    }
  }

  async quoteStaticInfo(args: unknown): Promise<ServerResult> {
    try {
      const params = QuoteStaticInfoSchema.parse(args);
      const quoteContext = await this.getQuoteContext();
      const staticInfo = await quoteContext.staticInfo(params.symbol)
      return {
        content: staticInfo.map(item => ({
          type: 'text',
          text: JSON.stringify(item)
        }))
      }
    } catch (error) {
      return this.handleErrorResult(error);
    }
  }

  async quoteRealtimeInfo(args: unknown): Promise<ServerResult> {
    try {
      const params = QuoteRealtimeInfoSchema.parse(args);
      const quoteContext = await this.getQuoteContext();
      const realtimeInfo = await quoteContext.quote(params.symbol)
      return {
        content: realtimeInfo.map(item => ({
          type: 'text',
          text: JSON.stringify(item)
        }))
      }
    } catch (error) {
      return this.handleErrorResult(error);
    }
  }

  async quoteDepth(args: unknown): Promise<ServerResult> {
    try {
      const params = QuoteDepthSchema.parse(args);
      const quoteContext = await this.getQuoteContext();
      const depth = await quoteContext.depth(params.symbol)
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(depth)
        }]
      }
    } catch (error) {
      return this.handleErrorResult(error);
    }
  }

  async quoteHistoryCandlesticks(args: unknown): Promise<ServerResult> {
    try {
      const params = QuoteHistoryCandlesticksSchema.parse(args);
      const quoteContext = await this.getQuoteContext();
      let historyCandlesticksPromise: ReturnType<typeof quoteContext.historyCandlesticksByDate> | ReturnType<typeof quoteContext.historyCandlesticksByOffset>;
      if (params.query_type === 1) {
        historyCandlesticksPromise = quoteContext.historyCandlesticksByOffset(params.symbol, params.period, params.adjust_type, params.offset_request?.forward, params.offset_request?.datetime, params.offset_request?.count ?? 10)
      } else {
        historyCandlesticksPromise = quoteContext.historyCandlesticksByDate(params.symbol, params.period, params.adjust_type, params.date_request?.start, params.date_request?.end)
      }
      const historyCandlesticks = await historyCandlesticksPromise
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(historyCandlesticks)
        }]
      }
    } catch (error) {
      return this.handleErrorResult(error);
    }
  }
}
