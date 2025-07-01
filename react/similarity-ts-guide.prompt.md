# AI エージェントによる similarity-ts リファクタリングガイド

## 概要

`similarity-ts`は、TypeScript/JavaScript コードベース内の重複コードを検出する Rust 製の高性能ツールです。AI エージェントがこのツールを活用して、効率的なリファクタリングを実行する方法を説明します。

## AI エージェントのリファクタリングワークフロー

### ステップ 1: 重複検出の実行

AI エージェントは以下のコマンドを実行して重複を検出します：

```bash
# プロジェクト全体の重複検出
similarity-ts .

# 閾値を調整して検出精度を制御
similarity-ts . --threshold 0.8

# 小さな関数も検出対象に含める
similarity-ts . --threshold 0.8 --min-lines 3

# コードも出力に含める（詳細分析用）
similarity-ts . --threshold 0.8 --print
```

### ステップ 2: 検出結果の分析

AI エージェントは出力結果を分析し、以下の情報を評価します：

```
Duplicates in src/utils.ts:
────────────────────────────────────────────────────────────
  src/utils.ts:10-20 calculateTotal <-> src/helpers.ts:5-15 computeSum
  Similarity: 92.50%, Score: 9.2 points
```

#### 優先度の判断基準

- **類似度 90%以上**: 即座にリファクタリング対象
- **類似度 85-89%**: 高優先度でリファクタリング検討
- **類似度 80-84%**: 中優先度で検討
- **スコア**: 行数 × 類似度で計算される影響度

### ステップ 3: リファクタリング戦略の決定

AI エージェントは検出された重複パターンに基づいて、適切なリファクタリング戦略を選択します。

## AI エージェントのリファクタリングパターン

### パターン 1: 関数の共通化

重複した関数を共通ユーティリティに抽出します。

#### 検出例

```bash
similarity-ts src/ --threshold 0.85 --print
```

```
src/components/UserCard.tsx:15-25 formatUserName <-> src/components/AdminCard.tsx:18-28 formatUserName
Similarity: 95.00%, Score: 9.5 points
```

#### AI エージェントの対応

1. **共通関数の抽出**

```typescript
// 新規作成: src/utils/formatters.ts
export const UserFormatter = {
  formatName: (firstName: string, lastName: string): string => {
    return `${firstName} ${lastName}`.trim();
  },

  formatEmail: (email: string): string => {
    return email.toLowerCase().trim();
  },
} as const;
```

2. **元ファイルの修正**

```typescript
// src/components/UserCard.tsx
import { UserFormatter } from "../utils/formatters";

// 重複していた関数を削除し、共通関数を使用
const displayName = UserFormatter.formatName(user.firstName, user.lastName);
```

### パターン 2: React コンポーネントの共通化

類似したコンポーネントを統合または共通化します。

#### 検出例

```bash
similarity-ts src/components/ --threshold 0.80 --min-lines 5
```

#### AI エージェントの対応

1. **共通コンポーネントの作成**

```typescript
// src/components/common/Card.tsx
interface CardProps {
  title: string;
  content: React.ReactNode;
  variant?: "user" | "admin" | "default";
  actions?: React.ReactNode;
}

export function Card({
  title,
  content,
  variant = "default",
  actions,
}: CardProps) {
  return (
    <div className={`card card--${variant}`}>
      <div className="card__header">
        <h3>{title}</h3>
      </div>
      <div className="card__content">{content}</div>
      {actions && <div className="card__actions">{actions}</div>}
    </div>
  );
}
```

2. **既存コンポーネントのリファクタリング**

```typescript
// src/components/UserCard.tsx（リファクタリング後）
import { Card } from "./common/Card";

interface UserCardProps {
  user: User;
}

export function UserCard({ user }: UserCardProps) {
  const content = (
    <>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
    </>
  );

  const actions = <button onClick={() => editUser(user.id)}>Edit User</button>;

  return (
    <Card
      title={user.name}
      content={content}
      variant="user"
      actions={actions}
    />
  );
}
```

### パターン 3: 型定義の統合

重複した型定義を共通の型ファイルに統合します。

#### 検出例

```bash
similarity-ts src/types/ --experimental-types --include-types --threshold 0.90
```

#### AI エージェントの対応

1. **共通型定義の作成**

```typescript
// src/types/common.ts
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseEntity {
  name: string;
  email: string;
  role: UserRole;
}

export interface AdminUser extends User {
  permissions: Permission[];
  lastLoginAt?: Date;
}

export type UserRole = "user" | "admin" | "super-admin";
export type Permission = "read" | "write" | "delete" | "admin";
```

2. **既存ファイルの更新**

```typescript
// 各ファイルで共通型をインポート
import type { User, AdminUser, UserRole } from "../types/common";
```

### パターン 4: カスタムフックの共通化

類似したカスタムフックを統合または抽象化します。

#### 検出例

```bash
similarity-ts src/hooks/ --filter-function "use" --threshold 0.85
```

#### AI エージェントの対応

1. **汎用カスタムフックの作成**

```typescript
// src/hooks/useApi.ts
interface UseApiOptions<T> {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  initialData?: T;
  dependencies?: unknown[];
}

export function useApi<T>({
  url,
  method = "GET",
  initialData,
  dependencies = [],
}: UseApiOptions<T>) {
  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, { method });
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [url, method]);

  useEffect(() => {
    fetchData();
  }, dependencies);

  return { data, loading, error, refetch: fetchData };
}
```

## AI エージェントによる自動化プロセス

### ステップ 1: 重複検出の自動実行

```bash
# 基本的な重複検出
similarity-ts . --threshold 0.85 --min-lines 5

# より詳細な分析
similarity-ts . --threshold 0.80 --print --experimental-types --include-types
```

### ステップ 2: 結果の構造化分析

AI エージェントは検出結果を以下の観点で分析します：

1. **影響度評価**: スコア（行数 × 類似度）による優先順位付け
2. **パターン分類**: 関数、コンポーネント、型定義、フックの種別特定
3. **依存関係分析**: リファクタリング時の影響範囲の特定
4. **リスク評価**: 変更による副作用の可能性評価

### ステップ 3: リファクタリングプランの生成

AI エージェントは以下の計画を立案します：

1. **抽出対象の特定**: 共通化すべきコードの特定
2. **配置場所の決定**: 新しいファイルの作成場所
3. **命名規則の適用**: 一貫した命名規則の適用
4. **段階的実装**: 依存関係を考慮した実装順序

### ステップ 4: 自動リファクタリングの実行

AI エージェントは以下の手順でリファクタリングを実行します：

1. **共通ファイルの作成**: 新しいユーティリティ/コンポーネントファイル
2. **既存ファイルの更新**: インポート文の追加と重複コードの削除
3. **型定義の更新**: 型の統合と一貫性の確保
4. **テストの更新**: 変更に伴うテストコードの修正

### ステップ 5: 検証とテスト

```bash
# リファクタリング後の重複チェック
similarity-ts . --threshold 0.85

# 型チェック
npm run type-check

# テスト実行
npm test

# リンター実行
npm run lint
```

## AI エージェント用のコマンドオプション詳細

### 検出精度の調整

```bash
# 基本的な重複検出（デフォルト閾値: 0.87）
similarity-ts .

# より多くの重複を検出（閾値を下げる）
similarity-ts . --threshold 0.80

# より厳密な重複のみ検出（閾値を上げる）
similarity-ts . --threshold 0.95

# 小さな関数も対象に含める
similarity-ts . --min-lines 2

# 大きな関数のみ対象にする
similarity-ts . --min-lines 10
```

### 出力オプション

```bash
# 重複コードを出力に含める（詳細分析用）
similarity-ts . --print

# 特定の拡張子のみ対象
similarity-ts . --extensions ts,tsx

# テストファイルを除外
similarity-ts . --exclude "**/*.test.ts" --exclude "**/*.spec.ts"
```

### 型分析オプション（実験的機能）

```bash
# 型の類似性も検出
similarity-ts . --experimental-types --include-types

# インターフェースのみチェック
similarity-ts . --interfaces-only --experimental-types

# 型エイリアスのみチェック
similarity-ts . --types-only --experimental-types

# 関数と型の混合比較
similarity-ts . --experimental-types --allow-cross-kind
```

### フィルタリングオプション

```bash
# 特定の関数名でフィルタ
similarity-ts . --filter-function "handle"

# React フックのみチェック
similarity-ts . --filter-function "use"

# 特定の処理内容でフィルタ
similarity-ts . --filter-function-body "useState"
```

## AI エージェント用のプロンプトテンプレート

AI エージェントがリファクタリングを実行する際の標準プロンプトです：

### 基本的なリファクタリングプロンプト（日本語）

```
`similarity-ts .` でコードの意味的な類似が得られます。あなたはこれを実行し、ソースコードの重複を検知して、リファクタリング計画を立てます。細かいオプションは similarity-ts -h で確認してください。

以下の手順で実行してください：
1. similarity-ts コマンドを実行して重複を検出
2. 検出結果を分析し、優先度を判定
3. コンパニオンオブジェクトパターンを活用した共通化を実装
4. 早期return、型安全性、ESLint準拠を確保
5. リファクタリング後の検証を実行
```

### 詳細分析用プロンプト（日本語）

```
similarity-ts . --threshold 0.8 --print --experimental-types でコードの詳細な重複分析を実行してください。

検出された重複について：
- 類似度90%以上は即座にリファクタリング
- 類似度85-89%は高優先度で検討
- 関数の重複は共通ユーティリティに抽出
- Reactコンポーネントの重複は共通コンポーネント化
- 型定義の重複は共通型ファイルに統合
- クラスは使用せずコンパニオンオブジェクトパターンを適用

実装ルールに従ってリファクタリングを実行してください。
```

### 英語版プロンプト

```
Run `similarity-ts .` to detect semantic code similarities. Execute this command, analyze the duplicate code patterns, and create a refactoring plan. Check `similarity-ts -h` for detailed options.

Follow these steps:
1. Execute similarity-ts command to detect duplicates
2. Analyze results and prioritize by similarity score
3. Implement common utilities using companion object pattern
4. Ensure early returns, type safety, and ESLint compliance
5. Verify refactoring results
```

## 継続的品質管理のための自動化

### package.json への統合

```json
{
  "scripts": {
    "check:duplication": "similarity-ts . --threshold 0.85 --min-lines 5",
    "check:duplication:strict": "similarity-ts . --threshold 0.90 --min-lines 3",
    "check:duplication:types": "similarity-ts . --experimental-types --include-types",
    "check:duplication:verbose": "similarity-ts . --print --threshold 0.80",
    "refactor:check": "npm run check:duplication && npm run type-check && npm test"
  }
}
```

### Pre-commit フックの設定

```bash
#!/bin/sh
# .git/hooks/pre-commit

echo "Checking for code duplication..."
similarity-ts . --threshold 0.90 --min-lines 5

if [ $? -ne 0 ]; then
  echo "Code duplication detected. Please refactor before committing."
  exit 1
fi

echo "No significant code duplication found."
```

## AI エージェントのトラブルシューティング

### よくある問題と対処法

#### 1. 検出結果が多すぎる場合

```bash
# 閾値を上げて検出を厳しくする
similarity-ts . --threshold 0.95

# 最小行数を増やして小さな重複を除外
similarity-ts . --min-lines 10

# 特定のディレクトリに絞って分析
similarity-ts src/components/ --threshold 0.85
```

#### 2. 誤検出が多い場合

```bash
# 構造的類似性の重みを調整
similarity-ts . --structural-weight 0.8 --naming-weight 0.2

# サイズペナルティを有効にして異なるサイズの関数の誤検出を減らす
similarity-ts . --threshold 0.90  # --no-size-penalty を使わない
```

#### 3. 実行時間が長い場合

```bash
# 高速モードを維持（デフォルト）
similarity-ts .  # --no-fast を使わない

# 対象ファイルを限定
similarity-ts src/components/ src/utils/

# 除外パターンを活用
similarity-ts . --exclude node_modules --exclude dist --exclude coverage
```

#### 4. 型検出がうまくいかない場合

```bash
# 実験的機能を段階的に有効化
similarity-ts . --experimental-types
similarity-ts . --experimental-types --include-types
similarity-ts . --experimental-types --include-types --allow-cross-kind
```

## 実践的な AI エージェントワークフロー例

### 段階的リファクタリングアプローチ

#### Phase 1: 高類似度の重複を検出・修正

```bash
# 95%以上の類似度の重複を検出
similarity-ts . --threshold 0.95 --print
```

→ AI エージェントが即座にリファクタリング実行

#### Phase 2: 中程度の類似度を分析・選択的修正

```bash
# 85-94%の類似度の重複を検出
similarity-ts . --threshold 0.85 --print
```

→ AI エージェントが影響度とコンテキストを分析して修正判断

#### Phase 3: 型定義の統合

```bash
# 型の重複を検出
similarity-ts . --experimental-types --include-types --threshold 0.90
```

→ AI エージェントが型安全性を保ちながら統合実行

#### Phase 4: 最終検証

```bash
# 全体の品質チェック
similarity-ts . --threshold 0.80
npm run type-check
npm test
npm run lint
```

### AI エージェントの判断フロー

1. **重複検出** → `similarity-ts . --threshold 0.85 --print`
2. **優先度評価** → スコア（類似度 × 行数）で順位付け
3. **パターン分析** → 関数/コンポーネント/型/フックの種別判定
4. **リスク評価** → テストカバレッジと依存関係の確認
5. **実装決定** → コンパニオンオブジェクトパターン等の適用
6. **段階的実行** → 小さな変更から順次適用
7. **検証実行** → 各段階でのテスト・型チェック実行

## まとめ

このガイドにより、AI エージェントは`similarity-ts`を効果的に活用して、以下を実現できます：

- **効率的な重複検出**: 適切な閾値設定による精密な分析
- **戦略的リファクタリング**: パターン別の最適化手法適用
- **品質保証**: 型安全性とテストカバレッジの維持
- **継続的改善**: 定期的な重複監視と予防

AI エージェントがこのワークフローに従うことで、コードベースの保守性と品質を継続的に向上させることが可能になります。
