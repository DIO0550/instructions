import { promptMetadata } from "./metadata.js";
/**
 * プロンプト検索機能
 */
export function searchPrompts(query, limit = 5) {
    const queryLower = query.toLowerCase();
    const results = [];
    for (const metadata of promptMetadata.values()) {
        let score = 0;
        // ファイル名での完全一致
        if (metadata.file.toLowerCase().includes(queryLower)) {
            score += 10;
        }
        // カテゴリでの一致
        if (metadata.category.toLowerCase().includes(queryLower)) {
            score += 8;
        }
        // キーワードでの一致
        const matchingKeywords = metadata.keywords.filter((keyword) => keyword.toLowerCase().includes(queryLower) ||
            queryLower.includes(keyword.toLowerCase()));
        score += matchingKeywords.length * 5;
        // 説明での一致
        if (metadata.description.toLowerCase().includes(queryLower)) {
            score += 3;
        }
        // コンテンツでの一致
        if (metadata.content.toLowerCase().includes(queryLower)) {
            score += 1;
        }
        if (score > 0) {
            results.push({ metadata, score });
        }
    }
    return results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((result) => result.metadata);
}
/**
 * コンテキストから技術スタックを検出
 */
function detectTechStack(context) {
    return {
        react: /\b(react|component|jsx|hook|state|props)\b/i.test(context),
        typescript: /\b(typescript|ts|type|interface)\b/i.test(context),
        testing: /\b(test|testing|tdd|vitest|jest|t-wada)\b/i.test(context),
        git: /\b(git|commit|branch|merge|pr|pull request)\b/i.test(context),
        implementation: /\b(implement|implementation|develop|code|function)\b/i.test(context),
        refactoring: /\b(refactor|refactoring|duplicate|similarity|tidy|cleanup|clean code)\b/i.test(context),
    };
}
/**
 * 関連プロンプト検索
 */
export function getRelevantPrompts(context) {
    const relevantPrompts = [];
    // コンテキストから技術スタックを推測
    const techStack = detectTechStack(context);
    // 技術スタックに基づいてプロンプトを推奨
    if (techStack.react) {
        relevantPrompts.push(...searchPrompts("react"));
    }
    if (techStack.typescript) {
        relevantPrompts.push(...searchPrompts("typescript"));
    }
    if (techStack.testing) {
        relevantPrompts.push(...searchPrompts("test"));
    }
    if (techStack.git) {
        relevantPrompts.push(...searchPrompts("commit"));
    }
    if (techStack.implementation) {
        relevantPrompts.push(...searchPrompts("implementation"));
    }
    if (techStack.refactoring) {
        relevantPrompts.push(...searchPrompts("similarity"));
        relevantPrompts.push(...searchPrompts("tidy"));
        relevantPrompts.push(...searchPrompts("refactor"));
    }
    // 重複除去
    const uniquePrompts = relevantPrompts.filter((prompt, index, self) => self.findIndex((p) => p.file === prompt.file) === index);
    return uniquePrompts.slice(0, 3); // 最大3つまで
}
/**
 * ファイル名でプロンプトを検索
 */
export function findPromptByFilename(filename) {
    let actualFile = filename;
    if (!actualFile.endsWith(".md")) {
        actualFile = `${actualFile}.md`;
    }
    const matchingFile = Array.from(promptMetadata.keys()).find((file) => file === actualFile || file.endsWith(`/${actualFile}`));
    return matchingFile || null;
}
