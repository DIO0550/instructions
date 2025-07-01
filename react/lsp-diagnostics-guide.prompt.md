# LSP 診断ツールを使ったコード問題修正ガイド

## 概要

Language Server Protocol (LSP) の診断機能を使用して、コードの構文エラーや警告を効率的に検出・修正する方法を説明します。

## LSP 診断ツールの基本的な使い方

### 1. ファイルの診断情報を取得

```
lsp_get_diagnostics ツールを使用してファイルの問題を検出
```

### 2. 診断結果の分析

取得できる情報：

- **エラーの種類**: 構文エラー、型エラー、セマンティックエラー
- **エラーの位置**: 行番号・列番号
- **重要度**: Error, Warning, Information, Hint
- **詳細メッセージ**: 問題の具体的な説明

### 3. 修正プロセス

#### Step 1: 問題の特定

1. 対象ファイルで診断を実行
2. エラーレベルの問題を優先的に確認
3. 警告レベルの問題も品質向上のため対応

#### Step 2: 問題の修正

1. **構文エラー**: 文法ルール違反の修正
2. **型エラー**: TypeScript 型定義の修正
3. **ESLint 警告**: コーディング規約の修正
4. **未使用変数**: 不要なコードの削除

#### Step 3: 修正後の検証

1. 再度診断を実行
2. 新たな問題が発生していないか確認
3. 関連ファイルへの影響をチェック

## 実践的な修正パターン

### TypeScript 関連の修正

#### 型エラーの修正

```typescript
// 修正前: 型エラー
function processUser(user) {
  return user.name.toUpperCase();
}

// 修正後: 型定義追加
interface User {
  name: string;
}

function processUser(user: User): string {
  return user.name.toUpperCase();
}
```

#### 未使用インポートの修正

```typescript
// 修正前: 未使用インポート警告
import { useState, useEffect, useMemo } from "react";

function MyComponent() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}

// 修正後: 必要なもののみインポート
import { useState } from "react";

function MyComponent() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}
```

### React 関連の修正

#### Props の型定義不足

```typescript
// 修正前: Props型未定義
function UserCard({ name, age, email }) {
  return (
    <div>
      <h2>{name}</h2>
      <p>Age: {age}</p>
      <p>Email: {email}</p>
    </div>
  );
}

// 修正後: Props型定義
interface UserCardProps {
  name: string;
  age: number;
  email: string;
}

function UserCard({ name, age, email }: UserCardProps) {
  return (
    <div>
      <h2>{name}</h2>
      <p>Age: {age}</p>
      <p>Email: {email}</p>
    </div>
  );
}
```

### ESLint/Prettier 関連の修正

#### 早期 return の適用

```typescript
// 修正前: ネストが深い
function validateUser(user: User): string {
  if (user) {
    if (user.name) {
      if (user.email) {
        return "Valid user";
      } else {
        return "Email is required";
      }
    } else {
      return "Name is required";
    }
  } else {
    return "User is required";
  }
}

// 修正後: 早期return適用
function validateUser(user: User): string {
  if (!user) {
    return "User is required";
  }

  if (!user.name) {
    return "Name is required";
  }

  if (!user.email) {
    return "Email is required";
  }

  return "Valid user";
}
```

## コンパニオンオブジェクトパターンでの修正

### クラス使用からコンパニオンパターンへの変換

```typescript
// 修正前: クラス使用（推奨されない）
class UserValidator {
  static validate(user: User): boolean {
    return user.name.length > 0 && user.email.includes("@");
  }

  static format(user: User): string {
    return `${user.name} <${user.email}>`;
  }
}

// 修正後: コンパニオンオブジェクトパターン
interface User {
  name: string;
  email: string;
}

const UserValidator = {
  validate: (user: User): boolean => {
    return user.name.length > 0 && user.email.includes("@");
  },

  format: (user: User): string => {
    return `${user.name} <${user.email}>`;
  },
} as const;
```

## 修正作業のベストプラクティス

### 1. 段階的な修正

- 重要度の高いエラーから順に対応
- 一度に大量の変更を行わない
- 各修正後にテストを実行

### 2. 型安全性の確保

- `any`型の使用を避ける
- 適切な型定義を追加
- 型ガードを活用

### 3. コード品質の向上

- マジックナンバーを定数化
- 関数の引数をオブジェクトで受け取る（4 つ以上または同じ型の場合）
- ESLint/Prettier ルールに準拠

### 4. 継続的な品質管理

- 定期的な診断実行
- CI/CD パイプラインでの自動チェック
- コードレビューでの品質確認

## まとめ

LSP 診断ツールを活用することで、コードの品質を継続的に保ち、バグの早期発見と修正が可能になります。定期的な診断実行とベストプラクティスの適用により、保守性の高いコードベースを維持できます。
