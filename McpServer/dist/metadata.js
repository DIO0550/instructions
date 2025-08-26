import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";
export const markdownFiles = new Map();
export const promptMetadata = new Map();
/**
 * コンテンツからキーワードを抽出
 */
function extractKeywordsFromContent(content) {
    const keywords = [];
    // ヘッダーからキーワードを抽出
    const headers = content.match(/^#+\s+(.+)$/gm);
    if (headers) {
        headers.forEach((header) => {
            const text = header.replace(/^#+\s+/, "").toLowerCase();
            keywords.push(...text.split(/\s+/));
        });
    }
    // 技術用語を抽出（React, TypeScript, Git など）
    const techTerms = content.match(/\b(react|typescript|javascript|git|npm|yarn|vite|next\.js|component|hook|test|tdd|refactor|commit|review|レビュー|comment|コメント|magic|number|マジック|ナンバー|tidyfirst|naming|命名)\b/gi);
    if (techTerms) {
        keywords.push(...techTerms.map((term) => term.toLowerCase()));
    }
    // code-review関連の特別なキーワードを追加
    if (content.includes("code-review") || content.includes("コードレビュー")) {
        keywords.push("code-review", "コードレビュー", "review", "レビュー");
    }
    return keywords;
}
/**
 * キーワード抽出とメタデータ生成
 */
export function extractMetadata(file, content) {
    const category = path.dirname(file).split("/").pop() || "general";
    const fileName = path.basename(file, ".md");
    // コンテンツからキーワードを抽出
    const keywords = [fileName, category, ...extractKeywordsFromContent(content)];
    // code-reviewディレクトリのファイルには追加キーワードを付与
    if (file.includes("/code-review/")) {
        keywords.push("code-review", "コードレビュー", "review", "レビュー");
        // ファイル名に基づく専門キーワードも追加
        if (fileName.includes("comment")) {
            keywords.push("comment", "コメント", "doc", "documentation");
        }
        if (fileName.includes("magic")) {
            keywords.push("magic", "number", "string", "マジックナンバー", "マジックストリング");
        }
        if (fileName.includes("test")) {
            keywords.push("test", "testing", "テスト", "unit", "integration");
        }
        if (fileName.includes("typescript")) {
            keywords.push("typescript", "naming", "convention", "命名", "規則");
        }
        if (fileName.includes("tidyfirst")) {
            keywords.push("tidyfirst", "refactor", "リファクタリング", "tidy", "beck");
        }
    }
    // 最初の段落を説明として使用
    const lines = content.split("\n").filter((line) => line.trim());
    const description = lines.find((line) => !line.startsWith("#"))?.trim() || fileName;
    return {
        file,
        content,
        category,
        keywords: [...new Set(keywords)], // 重複除去
        description,
    };
}
/**
 * マークダウンファイルを読み込み、メタデータを生成
 */
export async function loadMarkdownFiles() {
    try {
        const promptFiles = await glob("../**/*.prompt.md", {
            cwd: process.cwd(),
            ignore: ["../node_modules/**", "../dist/**", "../McpServer/**"],
        });
        const instructionFiles = await glob("../**/*instructions.md", {
            cwd: process.cwd(),
            ignore: ["../node_modules/**", "../dist/**", "../McpServer/**"],
        });
        // code-review配下の全Markdown（下書きや特別なファイル名も含めて取り込む）
        const codeReviewFiles = await glob("../code-review/**/*.md", {
            cwd: process.cwd(),
            ignore: ["../node_modules/**", "../dist/**", "../McpServer/**"],
        });
        const workspaceFiles = await glob("../workspace/**/*", {
            cwd: process.cwd(),
            ignore: ["../node_modules/**"],
        });
        const files = [
            ...promptFiles,
            ...instructionFiles,
            ...codeReviewFiles,
            ...workspaceFiles,
        ];
        for (const file of files) {
            const fullPath = path.resolve(file);
            const content = fs.readFileSync(fullPath, "utf-8");
            markdownFiles.set(file, content);
            // メタデータを抽出して保存
            const metadata = extractMetadata(file, content);
            promptMetadata.set(file, metadata);
        }
        console.error(`Loaded ${markdownFiles.size} markdown files with metadata`);
    }
    catch (error) {
        console.error("Error loading markdown files:", error);
    }
}
