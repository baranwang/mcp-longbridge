#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import zodToJsonSchema from "zod-to-json-schema";
import { QuoteDepthSchema, QuoteHistoryCandlesticksSchema, QuoteRealtimeInfoSchema, QuoteStaticInfoSchema, Tool, TradeAccountBalanceSchema, TradeStockPositionsSchema } from "./constants";
import { LongBridge } from "./long-bridge";

const server = new Server(
  {
    name: 'LongBridge',
    version: process.env.PACKAGE_VERSION ?? '0.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, () => {
  return {
    tools: [
      {
        name: Tool.TradeAccountBalance,
        description: 'The API is used to obtain the available, desirable, frozen, to-be-settled, and in-transit funds (fund purchase and redemption) information for each currency of the user.',
        inputSchema: zodToJsonSchema(TradeAccountBalanceSchema),
      },
      {
        name: Tool.TradeStockPositions,
        description: 'The API is used to obtain stock position information including account, stock code, number of shares held, number of available shares, average position price (calculated according to account settings), and currency.',
        inputSchema: zodToJsonSchema(TradeStockPositionsSchema),
      },
      {
        name: Tool.QuoteStaticInfo,
        description: 'This API is used to obtain the basic information of securities.',
        inputSchema: zodToJsonSchema(QuoteStaticInfoSchema),
      },
      {
        name: Tool.QuoteRealtimeInfo,
        description: 'This API is used to obtain the real-time quotes of securities, and supports all types of securities.',
        inputSchema: zodToJsonSchema(QuoteRealtimeInfoSchema),
      },
      {
        name: Tool.QuoteDepth,
        description: 'This API is used to obtain the depth data of security.',
        inputSchema: zodToJsonSchema(QuoteDepthSchema),
      },
      {
        name: Tool.QuoteHistoryCandlesticks,
        description: 'This API is used to obtain the history candlestick data of security.',
        inputSchema: zodToJsonSchema(QuoteHistoryCandlesticksSchema)
      }
    ],
  }
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const longBridge = new LongBridge()
  switch (request.params.name) {
    case Tool.TradeAccountBalance:
      return longBridge.tradeAccountBalance(request.params.arguments)
    case Tool.TradeStockPositions:
      return longBridge.tradeStockPositions(request.params.arguments)
    case Tool.QuoteStaticInfo:
      return longBridge.quoteStaticInfo(request.params.arguments)
    case Tool.QuoteRealtimeInfo:
      return longBridge.quoteRealtimeInfo(request.params.arguments)
    case Tool.QuoteDepth:
      return longBridge.quoteDepth(request.params.arguments)
    case Tool.QuoteHistoryCandlesticks:
      return longBridge.quoteHistoryCandlesticks(request.params.arguments)
    default:
      throw new Error(`Unknown tool ${request.params.name}`);
  }
});


(async () => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
})();
