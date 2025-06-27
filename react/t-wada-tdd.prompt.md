# t-wada 式 TDD プロンプト

## 基本理念

和田卓人（t-wada）さんの教えに基づくテスト駆動開発

- **テストファースト**: 実装前に必ずテストを書く
- **レッド・グリーン・リファクタ**: 失敗 → 成功 → 改善のサイクル
- **ベイビーステップ**: 小さな一歩ずつ進む
- **意図を表明**: テストでコードの意図を明確に示す

## TDD サイクル

### 1. Red（レッド）

```typescript
// まず失敗するテストを書く
describe("Calculator", () => {
  test("2つの数を足すことができる", () => {
    const calculator = new Calculator();
    expect(calculator.add(2, 3)).toBe(5);
  });
});

// この時点でCalculatorクラスは存在しない → テスト失敗
```

### 2. Green（グリーン）

```typescript
// テストが通る最小限のコードを書く
class Calculator {
  add(a: number, b: number): number {
    return 5; // 仮実装：テストが通る最小限
  }
}
```

### 3. Refactor（リファクタ）

```typescript
// 重複を排除し、コードを改善
class Calculator {
  add(a: number, b: number): number {
    return a + b; // 三角測量で正しい実装へ
  }
}
```

## t-wada 式のポイント

### 三角測量

```typescript
// 1つ目のテスト
test("2 + 3 = 5", () => {
  expect(calculator.add(2, 3)).toBe(5);
});

// 仮実装では return 5;

// 2つ目のテスト（三角測量）
test("3 + 4 = 7", () => {
  expect(calculator.add(3, 4)).toBe(7);
});

// これで一般化が必要になり、return a + b; へ
```

### テストの粒度

```typescript
// ❌ 粗すぎるテスト
test("ユーザー管理機能", () => {
  // 作成、更新、削除、検索を全部テスト
});

// ✅ 適切な粒度
test("ユーザーを作成できる", () => {
  const user = userService.create({ name: "taro" });
  expect(user.name).toBe("taro");
});

test("ユーザーを更新できる", () => {
  const user = userService.update(1, { name: "jiro" });
  expect(user.name).toBe("jiro");
});
```

### 明確なテスト名

```typescript
// ❌ 曖昧なテスト名
test("ユーザーテスト", () => {});
test("正常系", () => {});

// ✅ 明確なテスト名
test("有効な名前でユーザーを作成できる", () => {});
test("空の名前でユーザー作成時にエラーが発生する", () => {});
test("存在しないユーザーID指定時にnullを返す", () => {});
```

## React/TypeScript での TDD

### コンポーネント TDD

```typescript
// 1. テスト（Red）
import { render, screen } from "@testing-library/react";
import { UserCard } from "./UserCard";

test("ユーザー名を表示する", () => {
  const user = { id: 1, name: "たろう" };
  render(<UserCard user={user} />);

  expect(screen.getByText("たろう")).toBeInTheDocument();
});

// 2. 実装（Green）
interface User {
  id: number;
  name: string;
}

interface UserCardProps {
  user: User;
}

export const UserCard: React.FC<UserCardProps> = ({ user }) => {
  return <div>{user.name}</div>;
};

// 3. リファクタ（必要に応じて）
```

### カスタムフック TDD

```typescript
// 1. テスト（Red）
import { renderHook, act } from "@testing-library/react";
import { useCounter } from "./useCounter";

test("初期値が0である", () => {
  const { result } = renderHook(() => useCounter());
  expect(result.current.count).toBe(0);
});

test("incrementで値が1増加する", () => {
  const { result } = renderHook(() => useCounter());

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});

// 2. 実装（Green）
export const useCounter = () => {
  const [count, setCount] = useState(0);

  const increment = () => setCount((prev) => prev + 1);

  return { count, increment };
};
```

## 実践手順

### 開発フロー

1. **要件を小さく分解**: 機能を小さな単位に分割
2. **テストリスト作成**: 必要なテストケースをリスト化
3. **1 つずつ実装**: テスト → 実装 → リファクタを繰り返し
4. **継続的統合**: 頻繁にコミット・プッシュ

### デイリーチェック

- [ ] 新機能は必ずテストから開始
- [ ] テストが失敗することを確認してから実装
- [ ] 仮実装から始めて段階的に一般化
- [ ] グリーンになったらリファクタを検討
- [ ] テストが文書として機能しているか確認

## よくある落とし穴

### ❌ アンチパターン

```typescript
// テストのための実装
class Calculator {
  add(a: number, b: number): number {
    if (a === 2 && b === 3) return 5;
    if (a === 3 && b === 4) return 7;
    return 0; // テストに合わせただけ
  }
}
```

### ✅ 正しいアプローチ

```typescript
// 三角測量で一般化
class Calculator {
  add(a: number, b: number): number {
    return a + b; // 本質的な実装
  }
}
```

## t-wada の名言

> "テストがないコードはレガシーコードである"
>
> "テストはコードの意図を表明する手段"
>
> "小さく始めて、小さく保つ"

## 参考リソース

- t-wada「テスト駆動開発」
- t-wada「プログラマが知るべき 97 のこと」
- TDD Boot Camp 資料
