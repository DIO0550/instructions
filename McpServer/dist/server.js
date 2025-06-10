import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";
const markdownFiles = new Map();
async function loadMarkdownFiles() {
    try {
        const promptFiles = await glob("../**/*.prompt.md", {
            cwd: process.cwd(),
            ignore: ["../node_modules/**", "../dist/**", "../McpServer/**"],
        });
        const instructionFiles = await glob("../**/*instructions.md", {
            cwd: process.cwd(),
            ignore: ["../node_modules/**", "../dist/**", "../McpServer/**"],
        });
        const workspaceFiles = await glob("../workspace/**/*", {
            cwd: process.cwd(),
            ignore: ["../node_modules/**"],
        });
        const files = [...promptFiles, ...instructionFiles, ...workspaceFiles];
        for (const file of files) {
            const fullPath = path.resolve(file);
            const content = fs.readFileSync(fullPath, "utf-8");
            markdownFiles.set(file, content);
        }
        console.error(`Loaded ${markdownFiles.size} markdown files`);
    }
    catch (error) {
        console.error("Error loading markdown files:", error);
    }
}
const server = new McpServer({
    name: "markdown-prompts-server",
    version: "1.0.0",
}, {
    capabilities: {
        resources: {},
        prompts: {},
        tools: {},
    },
});
// Add resources
server.resource("all-markdown", "markdown://all", async () => {
    const fileList = Array.from(markdownFiles.entries()).map(([file, content]) => ({
        file,
        content,
        uri: `markdown://${file}`,
    }));
    return {
        contents: [
            {
                uri: "markdown://all",
                mimeType: "application/json",
                text: JSON.stringify(fileList, null, 2),
            }
        ]
    };
});
function addResourcesForFiles() {
    for (const file of markdownFiles.keys()) {
        // Remove leading "../" and use the full path as resource name
        const resourceName = file.replace(/^\.\.\//, "");
        server.resource(resourceName, `markdown://${file}`, async () => {
            return {
                contents: [
                    {
                        uri: `markdown://${file}`,
                        mimeType: "text/markdown",
                        text: markdownFiles.get(file) || "",
                    }
                ]
            };
        });
    }
}
// Add prompts
server.prompt("get_markdown_prompt", {
    filename: z.string().describe("マークダウンファイル名（.md拡張子ありまたはなし）"),
}, async (args) => {
    let actualFile = args.filename;
    if (!actualFile.endsWith(".md")) {
        actualFile = `${actualFile}.md`;
    }
    const matchingFile = Array.from(markdownFiles.keys()).find((file) => file === actualFile || file.endsWith(`/${actualFile}`));
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
// Add tools
server.tool("get_prompt", "指定されたマークダウンファイルの内容を取得します", {
    filename: z.string().describe("マークダウンファイル名（.md拡張子ありまたはなし）"),
}, async (args) => {
    let actualFile = args.filename;
    if (!actualFile.endsWith(".md")) {
        actualFile = `${actualFile}.md`;
    }
    const matchingFile = Array.from(markdownFiles.keys()).find((file) => file === actualFile || file.endsWith(`/${actualFile}`));
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
server.tool("list_prompts", "利用可能なマークダウンプロンプトの一覧を表示します", {}, async () => {
    const promptList = Array.from(markdownFiles.keys())
        .map((file) => `- ${file}`)
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
async function run() {
    await loadMarkdownFiles();
    addResourcesForFiles();
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
run().catch(console.error);
