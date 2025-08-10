# Tidyfirst コードレビュー プロンプト

## レビュー原則
Kent Beckの「Tidy First?」に基づき、**Tidying（整理）** と **Behavior Change（振る舞いの変更）** を分離する観点でレビューする。

## Tidyingの観点

### 優先度: 高
- Guard Clauses（早期リターン）
- Dead Code Removal
- Normalize Symmetries（対称性の統一）
- Extract Helper
- 型定義の明確化（any型の排除）

### 優先度: 中
- Reading Order
- Cohesion Order
- Explicit Parameters
- Chunk Statements
- 条件付きレンダリングの簡略化

### 優先度: 低
- Explaining Variables
- Explaining Constants
- One Pile
- Rename

## レビューフロー

1. **変更内容の分類**: Tidying / Behavior Change / 混在
2. **Tidying機会の特定**: 優先度順にリストアップ
3. **改善提案**: 具体的なBefore/Afterで提示
4. **実装順序の推奨**: TidyingとBehavior Changeを分けて実施

## React/TypeScript特有のTidying

### Guard Clausesパターン
```typescript
// Before: 深いネスト
if (user && user.isActive) {
  if (user.hasPermission) {
    return <Component />;
  }
}

// After: 早期リターン
if (!user?.isActive) return null;
if (!user.hasPermission) return null;
return <Component />;
```

### 型の明確化
```typescript
// Before: any型使用
const handler = (data: any) => {...}

// After: 明確な型定義
const handler = (data: UserData) => {...}
```

## 出力形式

```markdown
## サマリー
- 変更タイプ: [分類]
- Tidying機会: [件数]
- 型安全性の問題: [件数]（TypeScriptの場合）

## 改善提案

### [優先度] - [Tidying種類]
**該当箇所**: [ファイル:行番号]

```[言語]
// Before
[現在のコード]

// After  
[改善後のコード]
```

**理由**: [簡潔な説明]

## 推奨アクション
1. [具体的な次のステップ]
```

## 重要事項
- 小さく安全な変更を推奨
- 完璧より漸進的改善
- テストを変更しないTidyingを優先
- 経済的価値（コスト vs 利益）を考慮
- 型安全性を保証（TypeScript/React）
- 単一責任の原則を重視