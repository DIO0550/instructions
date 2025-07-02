import { z } from "zod";
import { markdownFiles, promptMetadata } from "./metadata.js";
import { searchPrompts, getRelevantPrompts, findPromptByFilename, } from "./search.js";
/**
 * MCPツールを登録
 */
export function registerTools(server) {
    // implementation-workflow.prompt.md専用取得ツール
    server.tool("get_implementation_workflow", "実装フローとGitワークフローのガイドライン（implementation-workflow.prompt.md）を取得します", {}, async () => {
        const workflowFile = "implementation-workflow.prompt.md";
        const matchingFile = findPromptByFilename(workflowFile);
        if (!matchingFile) {
            throw new Error(`Implementation workflow file not found: ${workflowFile}`);
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
    });
    // 指定されたマークダウンファイルの内容を取得
    server.tool("get_prompt", "指定されたマークダウンファイルの内容を取得します", {
        filename: z
            .string()
            .describe("マークダウンファイル名（.md拡張子ありまたはなし）"),
    }, async (args) => {
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
    });
    // 利用可能なマークダウンプロンプトの一覧を表示
    server.tool("list_prompts", "利用可能なマークダウンプロンプトの一覧を表示します", {}, async () => {
        const promptList = Array.from(promptMetadata.values())
            .map((metadata) => `- ${metadata.file} (${metadata.category}): ${metadata.description}`)
            .join("\n");
        return {
            content: [
                {
                    type: "text",
                    text: `Available markdown prompts:\n${promptList}`,
                },
            ],
        };
    });
    // キーワードでプロンプトを検索
    server.tool("search_prompts", "キーワードでプロンプトを検索し、関連するプロンプトファイルを取得します", {
        query: z
            .string()
            .describe("検索キーワード（技術用語、カテゴリ、機能名など）"),
        limit: z
            .number()
            .optional()
            .describe("取得する結果の最大数（デフォルト: 5）"),
    }, async (args) => {
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
            .map((metadata, index) => `${index + 1}. **${metadata.file}** (${metadata.category})\n   ${metadata.description}\n   Keywords: ${metadata.keywords.join(", ")}\n`)
            .join("\n");
        return {
            content: [
                {
                    type: "text",
                    text: `Found ${results.length} prompts for "${args.query}":\n\n${resultText}`,
                },
            ],
        };
    });
    // コンテキストに基づいて関連プロンプトを自動取得
    server.tool("get_relevant_prompts", "現在のコンテキストに基づいて関連するプロンプトを自動的に取得します", {
        context: z
            .string()
            .describe("現在の作業コンテキスト（技術スタック、作業内容、問題点など）"),
    }, async (args) => {
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
            .map((metadata, index) => `## ${index + 1}. ${metadata.file} (${metadata.category})\n\n${metadata.content}\n\n---\n`)
            .join("\n");
        return {
            content: [
                {
                    type: "text",
                    text: `Found ${relevantPrompts.length} relevant prompts:\n\n${promptsText}`,
                },
            ],
        };
    });
    // AIが必要と判断したプロンプトを自動取得
    server.tool("auto_get_prompt", "AIが必要と判断したプロンプトを自動的に検索・取得します", {
        task_description: z.string().describe("実行したいタスクの説明"),
        technology_stack: z
            .array(z.string())
            .optional()
            .describe("使用している技術スタック"),
    }, async (args) => {
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
            .filter((prompt, index, self) => self.findIndex((p) => p.file === prompt.file) === index)
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
                resultText += `${index + 1}. ${prompt.file} (${prompt.category}): ${prompt.description}\n`;
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
    });
}
