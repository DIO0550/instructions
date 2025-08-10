# パフォーマンスレビュープロンプト

## 基本理念

測定ファーストのパフォーマンス最適化

- **測定してから最適化**: 推測ではなく実測に基づく
- **ボトルネック特定**: 最も影響の大きい部分から改善
- **ユーザー中心**: Core Web Vitals を重視

## 必須チェック項目

### フロントエンド

- [ ] 不要な re-render 防止
- [ ] バンドルサイズ最適化
- [ ] 画像最適化
- [ ] Code splitting 実装
- [ ] キャッシュ戦略

### バックエンド

- [ ] N+1 クエリ問題なし
- [ ] 適切なキャッシュ
- [ ] 非同期処理活用
- [ ] メモリリーク防止
- [ ] データベース最適化

### API

- [ ] ペイロードサイズ最小化
- [ ] 圧縮適用
- [ ] ページネーション実装
- [ ] レート制限設定

## パフォーマンスパターン

### React 最適化

```tsx
// Before
const ExpensiveComponent = ({ data, onUpdate }) => {
  const processedData = data.map((item) => ({
    ...item,
    processed: true,
  }));

  return (
    <div>
      {processedData.map((item) => (
        <Item key={item.id} item={item} onClick={() => onUpdate(item)} />
      ))}
    </div>
  );
};

// After
const ExpensiveComponent = React.memo(({ data, onUpdate }) => {
  const processedData = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        processed: true,
      })),
    [data]
  );

  const handleItemClick = useCallback(
    (item) => {
      onUpdate(item);
    },
    [onUpdate]
  );

  return (
    <div>
      {processedData.map((item) => (
        <Item key={item.id} item={item} onClick={handleItemClick} />
      ))}
    </div>
  );
});
```

### データベース最適化

```typescript
// Before: N+1問題
const users = await User.findAll();
for (const user of users) {
  user.posts = await Post.findAll({ where: { userId: user.id } });
}

// After: JOIN使用
const users = await User.findAll({
  include: [{ model: Post }],
  attributes: ["id", "name", "email"],
});
```

### キャッシュ実装

```typescript
// Before
const getData = async (key: string) => {
  return await fetchFromDatabase(key);
};

// After
const cache = new Map();
const getData = async (key: string) => {
  if (cache.has(key)) {
    return cache.get(key);
  }

  const data = await fetchFromDatabase(key);
  cache.set(key, data);
  return data;
};
```

### 非同期処理

```typescript
// Before: CPUブロッキング
app.get("/process", (req, res) => {
  const result = heavyComputation(req.body.data);
  res.json(result);
});

// After: ワーカースレッド
import { Worker } from "worker_threads";

app.get("/process", async (req, res) => {
  const worker = new Worker("./heavy-computation-worker.js");
  worker.postMessage(req.body.data);

  worker.on("message", (result) => {
    res.json(result);
    worker.terminate();
  });
});
```

## 重要度分類

### 🔴 Critical

- ページロード > 3 秒
- API レスポンス > 1 秒
- メモリリーク
- CPU 使用率 > 80%

### 🟡 High

- バンドルサイズ > 1MB
- 不要な re-render
- 非効率クエリ

### 🟢 Medium

- 画像未最適化
- 軽微な改善

## モニタリングとメトリクス

### 1. パフォーマンス測定

- [ ] 重要なメトリクスが計測されているか
- [ ] APM（Application Performance Monitoring）が設定されているか
- [ ] Core Web Vitals が監視されているか
- [ ] カスタムメトリクスが適切に設定されているか

```typescript
// ✅ パフォーマンス測定
import { performance } from "perf_hooks";

const measurePerformance = (fn: Function, name: string) => {
  return async (...args: any[]) => {
    const start = performance.now();
    const result = await fn(...args);
    const end = performance.now();

    console.log(`${name} took ${end - start} milliseconds`);
    // メトリクス送信
    metrics.timing(`${name}.duration`, end - start);

    return result;
  };
};

// ✅ Web Vitals 測定（フロントエンド）
import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### 2. ログとアラート

- [ ] パフォーマンス関連のログが適切に記録されているか
- [ ] 閾値を超えた場合のアラートが設定されているか
- [ ] ボトルネックの特定が可能か
- [ ] 継続的な監視体制があるか

## プロファイリングツール

### 1. フロントエンド

- **Chrome DevTools**: Performance, Memory, Network タブ
- **React DevTools Profiler**: コンポーネントのレンダリング測定
- **Lighthouse**: 総合的なパフォーマンス評価
- **WebPageTest**: リアルユーザー環境でのテスト

### 2. バックエンド

- **Node.js**: built-in profiler, clinic.js
- **Database**: EXPLAIN, query profiler
- **APM**: New Relic, DataDog, AppDynamics
- **Custom**: Express middleware でのレスポンス時間測定

## パフォーマンステストの自動化

### 1. 継続的パフォーマンステスト

```yaml
# GitHub Actions例
name: Performance Tests
on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
      - name: Run load tests
        run: |
          npm run test:load
```

### 2. パフォーマンス回帰の検出

- ベースラインとの比較
- 閾値を超えた場合の CI 失敗
- 定期的なパフォーマンスレポート

## ベストプラクティス

### 1. 測定ファースト

- 推測ではなく実際の測定に基づく最適化
- プロファイリングによるボトルネック特定
- A/B テストによる効果検証

### 2. 段階的最適化

- 最も影響の大きい部分から着手
- 一度に複数の変更を行わない
- 各最適化の効果を個別に測定

### 3. ユーザー中心の指標

- Core Web Vitals の重視
- 実際のユーザー環境での測定
- ビジネス指標との関連付け

## 重要度の分類

### 🔴 Critical（緊急）

- ページロード時間 > 3 秒
- API レスポンス時間 > 1 秒
- メモリリーク
- CPU 使用率 > 80%

### 🟡 High（高）

- バンドルサイズ > 1MB
- 不必要な re-render
- 非効率なデータベースクエリ
- キャッシュ未実装

### 🟢 Medium（中）

- 画像未最適化
- 軽微なパフォーマンス改善
- モニタリング強化

### ⚪ Low（低）

- コード品質の改善
- ドキュメントの整備
- 将来の最適化準備
