#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import zodToJsonSchema from 'zod-to-json-schema';
import { LongBridge } from './api';
import { TOOLS_CONFIG, ToolNameSchema } from './constants';

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
    tools: Object.entries(TOOLS_CONFIG).map(([name, config]) => ({
      name,
      description: config.description,
      inputSchema: zodToJsonSchema(config.zodSchema),
    })),
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const longBridge = new LongBridge();
  const { success, data: name, error } = ToolNameSchema.safeParse(request.params.name);
  if (success) {
    return longBridge[TOOLS_CONFIG[name].funcName](request.params.arguments);
  }
  return longBridge.handleErrorResult(error);
});

(async () => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
})();
