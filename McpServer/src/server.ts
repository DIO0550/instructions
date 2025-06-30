import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadMarkdownFiles } from "./metadata.js";
import { registerResources, addResourcesForFiles } from "./resources.js";
import { registerPrompts } from "./prompts.js";
import { registerTools } from "./tools.js";

/**
 * MCPサーバーを作成
 */
const server = new McpServer(
  {
    name: "markdown-prompts-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      prompts: {},
      tools: {},
    },
  }
);

/**
 * サーバーを起動
 */
async function run(): Promise<void> {
  try {
    // マークダウンファイルの読み込み
    await loadMarkdownFiles();

    // 機能を登録
    registerResources(server);
    addResourcesForFiles(server);
    registerPrompts(server);
    registerTools(server);

    // トランスポートを開始
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error("MCP server started successfully");
  } catch (error) {
    console.error("Failed to start MCP server:", error);
    process.exit(1);
  }
}

run().catch(console.error);
