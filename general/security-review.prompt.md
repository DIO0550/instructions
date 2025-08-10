# セキュリティレビュープロンプト

## 基本理念

セキュリティファーストの原則に基づくレビュー

- **入力は信頼しない**: 全ての外部入力を検証
- **最小権限の原則**: 必要最小限の権限のみ付与
- **多層防御**: 複数のセキュリティ対策を組み合わせ

## 必須チェック項目

### 入力検証

- [ ] 全外部入力の検証
- [ ] SQL インジェクション対策
- [ ] XSS 対策
- [ ] ファイルアップロード検証
- [ ] 入力長制限

### 認証・認可

- [ ] パスワードハッシュ化
- [ ] セッション管理
- [ ] JWT 検証
- [ ] 権限チェック
- [ ] 直接オブジェクト参照対策

### 暗号化・保護

- [ ] 機密データ暗号化
- [ ] HTTPS 強制
- [ ] 暗号化キー管理
- [ ] 個人情報保護

### ログ・監視

- [ ] セキュリティイベントログ
- [ ] 機密情報ログ除外
- [ ] 異常検知
- [ ] インシデント対応

## セキュリティパターン

### 入力検証

```typescript
// Before
const query = `SELECT * FROM users WHERE id = ${userId}`;

// After
const query = "SELECT * FROM users WHERE id = ?";
db.query(query, [userId]);
```

### 認証

```typescript
// Before
const user = { password: password };

// After
const hashedPassword = await bcrypt.hash(password, 12);
const user = { password: hashedPassword };
```

### 認可

```typescript
// Before
app.get("/user/:id", (req, res) => {
  const user = getUserById(req.params.id);
  res.json(user);
});

// After
app.get("/user/:id", authenticateToken, (req, res) => {
  if (req.user.id !== parseInt(req.params.id) && !req.user.isAdmin) {
    return res.status(403).json({ error: "Access denied" });
  }
  const user = getUserById(req.params.id);
  res.json(user);
});
```

### XSS 対策

```tsx
// Before
<div dangerouslySetInnerHTML={{__html: userContent}} />

// After
<div>{userContent}</div> // Reactのデフォルトエスケープ
```

## 重要度分類

### 🔴 Critical

- SQL インジェクション
- XSS 脆弱性
- 認証バイパス
- 機密情報漏洩

### 🟡 High

- 権限管理不備
- 暗号化不備
- セッション管理問題

### 🟢 Medium

- セキュリティヘッダー不備
- ログ設定改善
- 設定強化

## React/フロントエンド固有のセキュリティ

### 1. XSS 対策

```tsx
// ❌ 危険な例
<div dangerouslySetInnerHTML={{__html: userContent}} />

// ✅ 安全な例（DOMPurify使用）
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(userContent)
}} />

// または
<div>{userContent}</div> // React のデフォルトエスケープを利用
```

### 2. CSRF 対策

```typescript
// ✅ CSRF トークンの実装
const csrfToken = getCsrfToken();
fetch("/api/data", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-CSRF-Token": csrfToken,
  },
  body: JSON.stringify(data),
});
```

### 3. 機密情報の保護

```typescript
// ❌ 危険な例
const config = {
  apiKey: "secret-api-key",
  databaseUrl: "mysql://user:pass@host/db",
};

// ✅ 安全な例
// 環境変数を使用し、フロントエンドには公開用のキーのみ
const config = {
  publicApiKey: process.env.REACT_APP_PUBLIC_API_KEY,
};
```

## バックエンド固有のセキュリティ

### 1. SQL インジェクション対策

```typescript
// ❌ 危険な例
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ 安全な例（パラメータ化クエリ）
const query = "SELECT * FROM users WHERE email = ?";
const result = await db.query(query, [email]);
```

### 2. NoSQL インジェクション対策

```typescript
// ❌ 危険な例
const user = await User.findOne({ username: req.body.username });

// ✅ 安全な例
const user = await User.findOne({
  username: { $eq: req.body.username },
});
```

### 3. レート制限

```typescript
// ✅ レート制限の実装
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // 最大100リクエスト
  message: "Too many requests",
});

app.use("/api/", limiter);
```

## セキュリティテストのチェックポイント

### 1. 自動化テスト

- [ ] セキュリティテストが CI/CD パイプラインに組み込まれているか
- [ ] 依存関係の脆弱性スキャンが実装されているか
- [ ] SAST（Static Application Security Testing）が実行されているか
- [ ] DAST（Dynamic Application Security Testing）が実行されているか

### 2. マニュアルテスト

- [ ] ペネトレーションテストが実施されているか
- [ ] コードレビューでセキュリティ観点が含まれているか
- [ ] セキュリティ設計レビューが実施されているか

## セキュリティヘッダーのチェック

### 必須セキュリティヘッダー

```typescript
// Express.js での設定例
app.use((req, res, next) => {
  // XSS Protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Content Type Options
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Frame Options
  res.setHeader("X-Frame-Options", "DENY");

  // HSTS (HTTPS)
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );

  // Content Security Policy
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'"
  );

  next();
});
```

## インシデント対応の準備

### 1. ログとモニタリング

- [ ] セキュリティイベントが適切にログされているか
- [ ] アラート機能が設定されているか
- [ ] ログの保管期間が適切か
- [ ] ログアクセスが制限されているか

### 2. 緊急対応手順

- [ ] インシデント対応計画が策定されているか
- [ ] 責任者と連絡先が明確か
- [ ] 復旧手順が文書化されているか
- [ ] 法的要件（報告義務等）が考慮されているか

## セキュリティレビューのベストプラクティス

### 1. 段階的アプローチ

1. **設計レビュー**: アーキテクチャレベルでのセキュリティ検討
2. **実装レビュー**: コードレベルでの脆弱性チェック
3. **テストレビュー**: セキュリティテストの妥当性確認
4. **デプロイレビュー**: 本番環境での設定確認

### 2. ツールの活用

- **SAST ツール**: SonarQube, Checkmarx, Veracode
- **DAST ツール**: OWASP ZAP, Burp Suite
- **依存関係チェック**: npm audit, Snyk, WhiteSource
- **コード品質**: ESLint security plugins

### 3. 継続的改善

- 定期的なセキュリティ教育
- 脅威モデリングの実施
- セキュリティ方針の更新
- インシデントからの学習

## 重要度の分類

### 🔴 Critical（緊急）

- SQL インジェクション、XSS などの明確な脆弱性
- 認証バイパス
- 機密情報の漏洩

### 🟡 High（高）

- 不適切な権限管理
- 暗号化の不備
- セッション管理の問題

### 🟢 Medium（中）

- セキュリティヘッダーの不備
- ログ設定の改善
- 設定の強化

### ⚪ Low（低）

- コード品質の改善
- ドキュメントの整備
- 監視の強化
