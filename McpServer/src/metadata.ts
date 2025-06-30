import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";
import { PromptMetadata } from "./types.js";

export const markdownFiles = new Map<string, string>();
export const promptMetadata = new Map<string, PromptMetadata>();

/**
 * コンテンツからキーワードを抽出
 */
function extractKeywordsFromContent(content: string): string[] {
  const keywords: string[] = [];

  // ヘッダーからキーワードを抽出
  const headers = content.match(/^#+\s+(.+)$/gm);
  if (headers) {
    headers.forEach((header) => {
      const text = header.replace(/^#+\s+/, "").toLowerCase();
      keywords.push(...text.split(/\s+/));
    });
  }

  // 技術用語を抽出（React, TypeScript, Git など）
  const techTerms = content.match(
    /\b(react|typescript|javascript|git|npm|yarn|vite|next\.js|component|hook|test|tdd|refactor|commit)\b/gi
  );
  if (techTerms) {
    keywords.push(...techTerms.map((term) => term.toLowerCase()));
  }

  return keywords;
}

/**
 * キーワード抽出とメタデータ生成
 */
export function extractMetadata(file: string, content: string): PromptMetadata {
  const category = path.dirname(file).split("/").pop() || "general";
  const fileName = path.basename(file, ".md");

  // コンテンツからキーワードを抽出
  const keywords = [fileName, category, ...extractKeywordsFromContent(content)];

  // 最初の段落を説明として使用
  const lines = content.split("\n").filter((line) => line.trim());
  const description =
    lines.find((line) => !line.startsWith("#"))?.trim() || fileName;

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
export async function loadMarkdownFiles(): Promise<void> {
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

      // メタデータを抽出して保存
      const metadata = extractMetadata(file, content);
      promptMetadata.set(file, metadata);
    }

    console.error(`Loaded ${markdownFiles.size} markdown files with metadata`);
  } catch (error) {
    console.error("Error loading markdown files:", error);
  }
}
