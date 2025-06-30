/**
 * プロンプトメタデータの型定義
 */
export interface PromptMetadata {
  file: string;
  content: string;
  category: string;
  keywords: string[];
  description: string;
}

/**
 * 検索結果の型定義
 */
export interface SearchResult {
  metadata: PromptMetadata;
  score: number;
}

/**
 * 技術スタックの検出結果
 */
export interface TechStack {
  react: boolean;
  typescript: boolean;
  testing: boolean;
  git: boolean;
  implementation: boolean;
}
