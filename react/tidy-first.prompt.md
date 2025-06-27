# Tidy First TypeScript/React プロンプト

## 基本理念

Kent Beck の「Tidy First」に基づく小さなリファクタリング

- **小さく整理**: 大きな変更前にまず整理
- **継続的改善**: 毎日少しずつ改善
- **安全第一**: テスト通過を維持
- **動作変更なし**: 機能は変更しない

## 主要パターン

### 1. ガード節

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

### 2. 型安全性向上

```typescript
// Before
interface Props {
  user: any;
  onSave: Function;
}

// After
interface UserFormProps {
  user: User;
  onSave: (user: User) => Promise<void>;
}
```

### 3. 関数名の統一

```typescript
// Before
const handleSuccess = (data: Data) => {
  /* */
};
const onError = (error: Error) => {
  /* */
};

// After
const handleSuccess = (data: Data) => {
  /* */
};
const handleError = (error: Error) => {
  /* */
};
```

## React/TypeScript 実例

### コンポーネント構造改善

```tsx
// Before
const UserProfile = ({ user }: { user: any }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user</div>;

  return <div>{user.name}</div>;
};

// After
interface UserProfileProps {
  user: User | null;
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const { data, loading, error } = useUserData(user?.id);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <EmptyState />;

  return <UserDisplay user={data} />;
};
```

### カスタムフック抽出

```typescript
// 共通ロジックをカスタムフックに
interface UseUserDataReturn {
  data: User | null;
  loading: boolean;
  error: string | null;
}

const useUserData = (userId?: string): UseUserDataReturn => {
  const [state, setState] = useState<UseUserDataReturn>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!userId) return;

    fetchUser(userId)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) =>
        setState({ data: null, loading: false, error: error.message })
      );
  }, [userId]);

  return state;
};
```

## 実行手順

1. **テスト確認**: `npm test` でテスト通過を確認
2. **小さな整理**: 1 つずつ実行
   - 型定義改善
   - 不要コード削除
   - ガード節導入
   - 変数名改善
3. **テスト再実行**: 各変更後に `npm test` で確認

## 日次チェックリスト

### 基本整理

- [ ] 未使用インポート削除
- [ ] `any` 型を具体的な型に変更
- [ ] 変数名の改善
- [ ] ガード節の導入

### 構造改善

- [ ] 長い関数を分割
- [ ] Props 型定義の改善
- [ ] カスタムフック抽出
- [ ] コンポーネント責任分離

## 実践のコツ

1. **小さく始める**: 1 回 1 つの概念のみ変更
2. **型安全性**: `any`を避け、具体的な型を使用
3. **テスト維持**: 常にグリーン状態を保つ
4. **継続性**: 毎日少しずつ実施
