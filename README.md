# MCP Longbridge

[![npm](https://img.shields.io/npm/v/mcp-longbridge)](https://www.npmjs.com/package/mcp-longbridge)

长桥证券 Model Context Protocol (MCP) 服务

## 使用方法

```json
{
  "mcpServers": {
    "longbridge": {
      "command": "npx",
      "args": ["-y", "mcp-longbridge@latest"],
      "env": {
        "LONGPORT_APP_KEY": "your-app-key",
        "LONGPORT_APP_SECRET": "your-app-secret",
        "LONGPORT_ACCESS_TOKEN": "your-access-token"
      }
    }
  }
}
```

其中 `LONGPORT_APP_KEY`、`LONGPORT_APP_SECRET` 和 `LONGPORT_ACCESS_TOKEN` 在 [LongPort OpenAPI](https://open.longportapp.com/) 获取。