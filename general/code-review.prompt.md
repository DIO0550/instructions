# コードレビュープロンプト

## 基本理念

Kent Beck の「Tidy First」に基づくコードレビュー

- **小さく整理**: 大きな変更前にまず整理
- **動作変更なし**: 機能は変更しない
- **安全第一**: テスト通過を維持
- **継続的改善**: 毎日少しずつ改善

## 必須チェック項目

### コード品質

- [ ] 関数の単一責任
- [ ] ガード節でエラーケース処理
- [ ] 意図が明確な命名
- [ ] DRY 原則遵守

### 型安全性

- [ ] 型定義明示
- [ ] any 型使用なし
- [ ] null/undefined チェック

### パフォーマンス

- [ ] N+1 問題なし
- [ ] 不要な計算除去
- [ ] 適切なキャッシュ

### セキュリティ

- [ ] 入力値検証
- [ ] SQL インジェクション対策
- [ ] XSS 対策
- [ ] 機密情報保護

### テスタビリティ

- [ ] テスト可能な構造
- [ ] 依存関係注入
- [ ] モック容易性

## Tidy First パターン

### ガード節

```typescript
// Before
function processUser(user: User | null): void {
  if (user && user.isActive) {
    if (user.hasPermission) {
      // 処理
    }
  }
}

// After
function processUser(user: User | null): void {
  if (!user?.isActive) return;
  if (!user.hasPermission) return;

  // 処理
}
```

### 型の細分化

```typescript
// Before
interface Props {
  data: any;
  callback: Function;
}

// After
interface UserFormProps {
  user: User;
  onSave: (user: User) => Promise<void>;
}
```

### 関数分割

```typescript
// Before
function processOrder(order: Order) {
  // 検証（30行）
  // 計算（20行）
  // 保存（15行）
}

// After
function processOrder(order: Order) {
  validateOrder(order);
  const total = calculateTotal(order);
  saveOrder(order, total);
}
```

### 条件式簡略化

```typescript
// Before
if (
  user &&
  user.isActive &&
  user.permissions &&
  user.permissions.includes("admin")
) {
  // 処理
}

// After
if (user?.isActive && user?.permissions?.includes("admin")) {
  // 処理
}
```

## 重要度分類

### 🔴 必須（Blocking）

- セキュリティ脆弱性
- テスト破綻
- 機能バグ

### 🟡 推奨（Should Fix）

- パフォーマンス問題
- 保守性問題
- 型安全性問題

### 🟢 改善（Nice to Have）

- コードスタイル
- 命名改善
- コメント追加
