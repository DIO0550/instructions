import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { markdownFiles, promptMetadata } from "./metadata.js";
import {
  searchPrompts,
  getRelevantPrompts,
  findPromptByFilename,
} from "./search.js";

/**
 * MCPツールを登録
 */
export function registerTools(server: McpServer): void {
  // implementation-workflow.prompt.md専用取得ツール
  server.tool(
    "get_implementation_workflow",
    "実装フローとGitワークフローのガイドライン（implementation-workflow.prompt.md）を取得します",
    {},
    async () => {
      const workflowFile = "implementation-workflow.prompt.md";
      const matchingFile = findPromptByFilename(workflowFile);

      if (!matchingFile) {
        throw new Error(
          `Implementation workflow file not found: ${workflowFile}`
        );
      }

      const content = markdownFiles.get(matchingFile);
      return {
        content: [
          {
            type: "text",
            text: content || "",
          },
        ],
      };
    }
  );

  // 指定されたマークダウンファイルの内容を取得
  server.tool(
    "get_prompt",
    "指定されたマークダウンファイルの内容を取得します",
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
        content: [
          {
            type: "text",
            text: content || "",
          },
        ],
      };
    }
  );

  // 利用可能なマークダウンプロンプトの一覧を表示
  server.tool(
    "list_prompts",
    "利用可能なマークダウンプロンプトの一覧を表示します",
    {},
    async () => {
      const promptList = Array.from(promptMetadata.values())
        .map(
          (metadata) =>
            `- ${metadata.file} (${metadata.category}): ${metadata.description}`
        )
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Available markdown prompts:\n${promptList}`,
          },
        ],
      };
    }
  );

  // キーワードでプロンプトを検索
  server.tool(
    "search_prompts",
    "キーワードでプロンプトを検索し、関連するプロンプトファイルを取得します",
    {
      query: z
        .string()
        .describe("検索キーワード（技術用語、カテゴリ、機能名など）"),
      limit: z
        .number()
        .optional()
        .describe("取得する結果の最大数（デフォルト: 5）"),
    },
    async (args) => {
      const results = searchPrompts(args.query, args.limit || 5);

      if (results.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No prompts found for query: "${args.query}"`,
            },
          ],
        };
      }

      const resultText = results
        .map(
          (metadata, index) =>
            `${index + 1}. **${metadata.file}** (${metadata.category})\n   ${
              metadata.description
            }\n   Keywords: ${metadata.keywords.join(", ")}\n`
        )
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Found ${results.length} prompts for "${args.query}":\n\n${resultText}`,
          },
        ],
      };
    }
  );

  // コンテキストに基づいて関連プロンプトを自動取得
  server.tool(
    "get_relevant_prompts",
    "現在のコンテキストに基づいて関連するプロンプトを自動的に取得します",
    {
      context: z
        .string()
        .describe(
          "現在の作業コンテキスト（技術スタック、作業内容、問題点など）"
        ),
    },
    async (args) => {
      const relevantPrompts = getRelevantPrompts(args.context);

      if (relevantPrompts.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No relevant prompts found for the given context.",
            },
          ],
        };
      }

      const promptsText = relevantPrompts
        .map(
          (metadata, index) =>
            `## ${index + 1}. ${metadata.file} (${metadata.category})\n\n${
              metadata.content
            }\n\n---\n`
        )
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Found ${relevantPrompts.length} relevant prompts:\n\n${promptsText}`,
          },
        ],
      };
    }
  );

  // AIが必要と判断したプロンプトを自動取得
  server.tool(
    "auto_get_prompt",
    "AIが必要と判断したプロンプトを自動的に検索・取得します",
    {
      task_description: z.string().describe("実行したいタスクの説明"),
      technology_stack: z
        .array(z.string())
        .optional()
        .describe("使用している技術スタック"),
    },
    async (args) => {
      // タスクの説明から適切なプロンプトを推測
      let searchQuery = args.task_description;

      if (args.technology_stack && args.technology_stack.length > 0) {
        searchQuery += " " + args.technology_stack.join(" ");
      }

      const relevantPrompts = getRelevantPrompts(searchQuery);
      const searchResults = searchPrompts(searchQuery, 3);

      // 結果をマージして重複除去
      const allResults = [...relevantPrompts, ...searchResults];
      const uniqueResults = allResults
        .filter(
          (prompt, index, self) =>
            self.findIndex((p) => p.file === prompt.file) === index
        )
        .slice(0, 3);

      if (uniqueResults.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No suitable prompts found for task: "${args.task_description}"`,
            },
          ],
        };
      }

      const bestPrompt = uniqueResults[0];
      const alternativePrompts = uniqueResults.slice(1);

      let resultText = `**Recommended prompt for "${args.task_description}":**\n\n`;
      resultText += `## ${bestPrompt.file} (${bestPrompt.category})\n\n${bestPrompt.content}\n\n`;

      if (alternativePrompts.length > 0) {
        resultText += `**Alternative prompts:**\n`;
        alternativePrompts.forEach((prompt, index) => {
          resultText += `${index + 1}. ${prompt.file} (${prompt.category}): ${
            prompt.description
          }\n`;
        });
      }

      return {
        content: [
          {
            type: "text",
            text: resultText,
          },
        ],
      };
    }
  );

  // code-reviewカテゴリの一覧
  server.tool(
    "list_code_review_prompts",
    "code-reviewカテゴリのプロンプト一覧を表示します",
    {},
    async () => {
      const list = Array.from(promptMetadata.values())
        .filter((m) => m.category === "code-review")
        .map((m) => `- ${m.file}: ${m.description}`)
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: list || "No code-review prompts found.",
          },
        ],
      };
    }
  );

  // code-review配下の特定ファイル取得
  server.tool(
    "get_code_review_prompt",
    "code-review配下の指定ファイルを取得します",
    {
      filename: z
        .string()
        .describe("code-review配下のファイル名（.md拡張子ありまたはなし）"),
    },
    async (args) => {
      const name = args.filename.endsWith(".md")
        ? args.filename
        : `${args.filename}.md`;
      // フル相対パスで探す
      const candidates = Array.from(promptMetadata.values()).filter(
        (m) =>
          m.file.endsWith(`/code-review/${name}`) ||
          m.file === `../code-review/${name}`
      );
      const found = candidates[0]?.file;
      const file = found || findPromptByFilename(name);
      if (!file) {
        throw new Error(`Code review prompt not found: ${args.filename}`);
      }
      // カテゴリチェック
      const meta = promptMetadata.get(file);
      if (!meta || meta.category !== "code-review") {
        throw new Error(`Not a code-review prompt: ${file}`);
      }

      const content = markdownFiles.get(file) || "";
      return {
        content: [
          {
            type: "text",
            text: content,
          },
        ],
      };
    }
  );
}

/**
 * MCPツールを登録
 */
export function registerToolsNew(server: McpServer): void {
  // implementation-workflow.prompt.md専用取得ツール
  server.registerTool(
    "get_implementation_workflow",
    {
      title: "Get Implementation Workflow",
      description:
        "実装フローとGitワークフローのガイドライン（implementation-workflow.prompt.md）を取得します",
      inputSchema: {},
    },
    async () => {
      const workflowFile = "implementation-workflow.prompt.md";
      const matchingFile = findPromptByFilename(workflowFile);

      if (!matchingFile) {
        throw new Error(
          `Implementation workflow file not found: ${workflowFile}`
        );
      }

      const content = markdownFiles.get(matchingFile);
      return {
        content: [
          {
            type: "text",
            text: content || "",
          },
        ],
      };
    }
  );

  // 指定されたマークダウンファイルの内容を取得
  server.registerTool(
    "get_prompt",
    {
      title: "Get Prompt",
      description: "指定されたマークダウンファイルの内容を取得します",
      inputSchema: {
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
        content: [
          {
            type: "text",
            text: content || "",
          },
        ],
      };
    }
  );

  // 利用可能なマークダウンプロンプトの一覧を表示
  server.registerTool(
    "list_prompts",
    {
      title: "List Prompts",
      description: "利用可能なマークダウンプロンプトの一覧を表示します",
      inputSchema: {},
    },
    async () => {
      const promptList = Array.from(promptMetadata.values())
        .map(
          (metadata) =>
            `- ${metadata.file} (${metadata.category}): ${metadata.description}`
        )
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Available markdown prompts:\n${promptList}`,
          },
        ],
      };
    }
  );

  // キーワードでプロンプトを検索
  server.registerTool(
    "search_prompts",
    {
      title: "Search Prompts",
      description:
        "キーワードでプロンプトを検索し、関連するプロンプトファイルを取得します",
      inputSchema: {
        query: z
          .string()
          .describe("検索キーワード（技術用語、カテゴリ、機能名など）"),
        limit: z
          .number()
          .optional()
          .describe("取得する結果の最大数（デフォルト: 5）"),
      },
    },
    async ({ query, limit = 5 }) => {
      const results = searchPrompts(query, limit);

      if (results.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No prompts found for query: "${query}"`,
            },
          ],
        };
      }

      const resultText = results
        .map(
          (metadata, index) =>
            `${index + 1}. **${metadata.file}** (${metadata.category})\n   ${
              metadata.description
            }\n   Keywords: ${metadata.keywords.join(", ")}\n`
        )
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Found ${results.length} prompts for "${query}":\n\n${resultText}`,
          },
        ],
      };
    }
  );

  // コンテキストに基づいて関連プロンプトを自動取得
  server.registerTool(
    "get_relevant_prompts",
    {
      title: "Get Relevant Prompts",
      description:
        "現在のコンテキストに基づいて関連するプロンプトを自動的に取得します",
      inputSchema: {
        context: z
          .string()
          .describe(
            "現在の作業コンテキスト（技術スタック、作業内容、問題点など）"
          ),
      },
    },
    async ({ context }) => {
      const relevantPrompts = getRelevantPrompts(context);

      if (relevantPrompts.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No relevant prompts found for the given context.",
            },
          ],
        };
      }

      const promptsText = relevantPrompts
        .map(
          (metadata, index) =>
            `## ${index + 1}. ${metadata.file} (${metadata.category})\n\n${
              metadata.content
            }\n\n---\n`
        )
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Found ${relevantPrompts.length} relevant prompts:\n\n${promptsText}`,
          },
        ],
      };
    }
  );

  // AIが必要と判断したプロンプトを自動取得
  server.registerTool(
    "auto_get_prompt",
    {
      title: "Auto Get Prompt",
      description: "AIが必要と判断したプロンプトを自動的に検索・取得します",
      inputSchema: {
        task_description: z.string().describe("実行したいタスクの説明"),
        technology_stack: z
          .array(z.string())
          .optional()
          .describe("使用している技術スタック"),
      },
    },
    async ({ task_description, technology_stack }) => {
      // タスクの説明から適切なプロンプトを推測
      let searchQuery = task_description;

      if (technology_stack && technology_stack.length > 0) {
        searchQuery += " " + technology_stack.join(" ");
      }

      const relevantPrompts = getRelevantPrompts(searchQuery);
      const searchResults = searchPrompts(searchQuery, 3);

      // 結果をマージして重複除去
      const allResults = [...relevantPrompts, ...searchResults];
      const uniqueResults = allResults
        .filter(
          (prompt, index, self) =>
            self.findIndex((p) => p.file === prompt.file) === index
        )
        .slice(0, 3);

      if (uniqueResults.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No suitable prompts found for task: "${task_description}"`,
            },
          ],
        };
      }

      const bestPrompt = uniqueResults[0];
      const alternativePrompts = uniqueResults.slice(1);

      let resultText = `**Recommended prompt for "${task_description}":**\n\n`;
      resultText += `## ${bestPrompt.file} (${bestPrompt.category})\n\n${bestPrompt.content}\n\n`;

      if (alternativePrompts.length > 0) {
        resultText += `**Alternative prompts:**\n`;
        alternativePrompts.forEach((prompt, index) => {
          resultText += `${index + 1}. ${prompt.file} (${prompt.category}): ${
            prompt.description
          }\n`;
        });
      }

      return {
        content: [
          {
            type: "text",
            text: resultText,
          },
        ],
      };
    }
  );

  // code-reviewカテゴリの一覧
  server.registerTool(
    "list_code_review_prompts",
    {
      title: "List Code Review Prompts",
      description: "code-reviewカテゴリのプロンプト一覧を表示します",
      inputSchema: {},
    },
    async () => {
      const list = Array.from(promptMetadata.values())
        .filter((m) => m.category === "code-review")
        .map((m) => `- ${m.file}: ${m.description}`)
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: list || "No code-review prompts found.",
          },
        ],
      };
    }
  );

  // code-review配下の特定ファイル取得
  server.registerTool(
    "get_code_review_prompt",
    {
      title: "Get Code Review Prompt",
      description: "code-review配下の指定ファイルを取得します",
      inputSchema: {
        filename: z
          .string()
          .describe("code-review配下のファイル名（.md拡張子ありまたはなし）"),
      },
    },
    async ({ filename }) => {
      const name = filename.endsWith(".md") ? filename : `${filename}.md`;
      const candidates = Array.from(promptMetadata.values()).filter(
        (m) =>
          m.file.endsWith(`/code-review/${name}`) ||
          m.file === `../code-review/${name}`
      );
      const found = candidates[0]?.file;
      const file = found || findPromptByFilename(name);
      if (!file) {
        throw new Error(`Code review prompt not found: ${filename}`);
      }
      const meta = promptMetadata.get(file);
      if (!meta || meta.category !== "code-review") {
        throw new Error(`Not a code-review prompt: ${file}`);
      }

      const content = markdownFiles.get(file) || "";
      return {
        content: [
          {
            type: "text",
            text: content,
          },
        ],
      };
    }
  );
}
