import { z } from "zod";
import { markdownFiles } from "./metadata.js";
import { findPromptByFilename } from "./search.js";
/**
 * MCPプロンプトを登録
 */
export function registerPrompts(server) {
    server.prompt("get_markdown_prompt", {
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
    });
}
