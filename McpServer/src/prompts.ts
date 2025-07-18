import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { markdownFiles } from "./metadata.js";
import { findPromptByFilename } from "./search.js";

/**
 * MCPプロンプトを登録
 */
export function registerPrompts(server: McpServer): void {
  server.prompt(
    "get_markdown_prompt",
    {
      filename: z
        .string()
        .describe("マークダウンファイル名（.md拡張子ありまたはなし）"),
    },
    async (args) => {
      const matchingFile = findPromptByFilename(args.filename);

      if (!matchingFile) {
        throw new Error(`Prompt file not found: ${args.filename}`);
      }

      const content = markdownFiles.get(matchingFile);
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: content || "",
            },
          },
        ],
      };
    }
  );
}

/**
 * MCPプロンプトを登録
 */
export function registerPromptsNew(server: McpServer): void {
  server.registerPrompt(
    "get_markdown_prompt",
    {
      title: "Get Markdown Prompt",
      description: "指定されたマークダウンファイルの内容を取得します",
      argsSchema: {
        filename: z
          .string()
          .describe("マークダウンファイル名（.md拡張子ありまたはなし）"),
      },
    },
    async ({ filename }) => {
      const matchingFile = findPromptByFilename(filename);

      if (!matchingFile) {
        throw new Error(`Prompt file not found: ${filename}`);
      }

      const content = markdownFiles.get(matchingFile);
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: content || "",
            },
          },
        ],
      };
    }
  );
}
