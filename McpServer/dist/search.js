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
        // code-reviewディレクトリのファイルには追加スコア
        if (metadata.file.includes("/code-review/")) {
            // code-review関連クエリには高スコア
            if (["review", "レビュー", "code-review", "コードレビュー"].some((term) => queryLower.includes(term) || term.includes(queryLower))) {
                score += 15;
            }
            // 特定のレビュータイプクエリ
            if (queryLower.includes("comment") || queryLower.includes("コメント")) {
                score += metadata.file.includes("comment") ? 12 : 3;
            }
            if (queryLower.includes("magic") || queryLower.includes("マジック")) {
                score += metadata.file.includes("magic") ? 12 : 3;
            }
            if (queryLower.includes("test") && queryLower.includes("review")) {
                score += metadata.file.includes("test-code-review") ? 12 : 3;
            }
            if (queryLower.includes("naming") || queryLower.includes("命名")) {
                score += metadata.file.includes("naming") ? 12 : 3;
            }
            if (queryLower.includes("tidy")) {
                score += metadata.file.includes("tidyfirst") ? 12 : 3;
            }
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
        // code-review関連の検出を追加
        codeReview: /\b(review|レビュー|code.?review|コードレビュー|comment|コメント|magic.?number|naming|命名)\b/i.test(context),
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
    if (techStack.codeReview) {
        relevantPrompts.push(...searchPrompts("code-review"));
        relevantPrompts.push(...searchPrompts("コードレビュー"));
        relevantPrompts.push(...searchPrompts("review"));
        relevantPrompts.push(...searchPrompts("comment"));
        relevantPrompts.push(...searchPrompts("magic"));
        relevantPrompts.push(...searchPrompts("naming"));
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
