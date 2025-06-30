import { markdownFiles } from "./metadata.js";
/**
 * MCPリソースを登録
 */
export function registerResources(server) {
    // 全マークダウンファイルの一覧
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
                },
            ],
        };
    });
}
/**
 * 個別ファイル用のリソースを追加
 */
export function addResourcesForFiles(server) {
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
                    },
                ],
            };
        });
    }
}
