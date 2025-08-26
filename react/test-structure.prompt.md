# テスト構造のベストプラクティス

**Keywords**: test, testing, structure, nesting, flat, kent-c-dodds, avoid-nesting

## ネストを避けたテスト設計

Kent C. Dodds の「Avoid nesting when you're testing」の原則に基づき、以下のガイドラインに従う：

### ❌ 避けるべきパターン（過度なネスト）

```javascript
describe("ユーザー管理", () => {
  describe("ログイン機能", () => {
    describe("正常系", () => {
      describe("有効なメールアドレスの場合", () => {
        test("ログインが成功する", () => {
          // テストコード
        });
      });
    });

    describe("異常系", () => {
      describe("無効なメールアドレスの場合", () => {
        test("エラーメッセージが表示される", () => {
          // テストコード
        });
      });
    });
  });
});
```

### ✅ 推奨パターン（フラットな構造）

```javascript
// login.test.js - describeを使わずにフラットな構造
test("有効なメールアドレスでログインが成功する", () => {
  // テストコード
});

test("無効なメールアドレスの場合はエラーメッセージが表示される", () => {
  // テストコード
});

test("パスワードが間違っている場合はログインが失敗する", () => {
  // テストコード
});
```

## describe を使用すべき場面

- **関連するテストのグループ化**：明確に関連性があるテストケース群
- **セットアップの共有**：beforeEach、beforeAll などでのテスト環境準備が必要な場合
- **テスト対象の明確化**：異なるコンポーネントや関数のテストを分離する場合

## describe を避けるべき場面

- **単なる分類目的**：「正常系」「異常系」などの単純な分類
- **1 つしかテストがない場合**：describe 内にテストが 1 つしかない
- **過度な階層化**：3 レベル以上の深いネスト構造

## フラット構造の利点

1. **可読性の向上**：テストの意図が明確になる
2. **保守性の向上**：テストの追加・修正が容易になる
3. **実行効率**：テストランナーが効率的に実行できる
4. **エラー特定の容易性**：失敗したテストの場所が特定しやすい

## test vs it について

- **test** は **it** のエイリアスです
- **フラットな構造では test を使用**：describe ブロック外では `test` を推奨
- **ネストされた場合は it を使用**：describe ブロック内では `it` を使用（ただし、ネスト自体を避けることを推奨）
- **一貫性の維持**：プロジェクト内で統一した記述方法を採用する

## 実践的な命名規則

テスト名に必要な情報を含めることで、describe の必要性を減らす：

```javascript
// ✅ 良い例：テスト名に十分な情報が含まれている（describeなしのフラット構造）
test("空の配列を渡した場合は空配列を返す", () => {});
test("数値の配列を渡した場合はソート済み配列を返す", () => {});
test("文字列を含む配列を渡した場合はエラーをスローする", () => {});

// ❌ 避けるべき例：describeによる過度な構造化
describe("sortNumbers関数", () => {
  describe("正常系", () => {
    test("ソートされた配列を返す", () => {}); // 情報が不足
  });
});
```

## 可変変数の問題とその解決策

### ❌ 可変変数による問題（Kent C. Dodds の記事より）

```javascript
describe("Login", () => {
  let utils,
    handleSubmit,
    user,
    changeUsernameInput,
    changePasswordInput,
    clickSubmit;

  beforeEach(() => {
    handleSubmit = jest.fn();
    user = { username: "michelle", password: "smith" };
    utils = render(<Login onSubmit={handleSubmit} />);
    changeUsernameInput = (value) =>
      userEvent.type(utils.getByLabelText(/username/i), value);
    changePasswordInput = (value) =>
      userEvent.type(utils.getByLabelText(/password/i), value);
    clickSubmit = () => userEvent.click(utils.getByText(/submit/i));
  });

  describe("when username and password is provided", () => {
    beforeEach(() => {
      changeUsernameInput(user.username);
      changePasswordInput(user.password);
    });

    describe("when the submit button is clicked", () => {
      beforeEach(() => {
        clickSubmit();
      });

      test("should call onSubmit with the username and password", () => {
        // handleSubmit はどこから来ている？何度も再代入されている可能性は？
        expect(handleSubmit).toHaveBeenCalledTimes(1);
        expect(handleSubmit).toHaveBeenCalledWith(user);
      });
    });
  });
});
```

**問題点**：

- 変数がどこで定義・代入されているかを追跡する必要がある
- ネストした beforeEach で値が上書きされる可能性がある
- テストを理解するために頭の中で状態を追跡する必要がある

### ✅ インライン化による解決

```javascript
test("calls onSubmit with username and password when submit is clicked", () => {
  const handleSubmit = jest.fn();
  const { getByLabelText, getByText } = render(
    <Login onSubmit={handleSubmit} />
  );
  const user = { username: "michelle", password: "smith" };

  userEvent.type(getByLabelText(/username/i), user.username);
  userEvent.type(getByLabelText(/password/i), user.password);
  userEvent.click(getByText(/submit/i));

  expect(handleSubmit).toHaveBeenCalledTimes(1);
  expect(handleSubmit).toHaveBeenCalledWith(user);
});

test("shows error message when submit is clicked and no username is provided", () => {
  const handleSubmit = jest.fn();
  const { getByLabelText, getByText, getByRole } = render(
    <Login onSubmit={handleSubmit} />
  );

  userEvent.type(getByLabelText(/password/i), "anything");
  userEvent.click(getByText(/submit/i));

  const errorMessage = getByRole("alert");
  expect(errorMessage).toHaveTextContent(/username is required/i);
  expect(handleSubmit).not.toHaveBeenCalled();
});
```

**利点**：

- すべての変数がローカルスコープで定義されている
- テスト全体が自己完結している
- 変数の追跡が不要

## AHA 原則の適用（Avoid Hasty Abstractions）

### 基本方針

> "重複を恐れるより、間違った抽象化を恐れよ。まず変更に最適化せよ"

### 関数による適切な抽象化

重複が問題になってきた場合は、beforeEach ではなく**関数**を使用する：

```javascript
// ✅ 関数による抽象化（必要になってから適用）
function setup() {
  const handleSubmit = jest.fn();
  const utils = render(<Login onSubmit={handleSubmit} />);
  const user = { username: "michelle", password: "smith" };
  const changeUsernameInput = (value) =>
    userEvent.type(utils.getByLabelText(/username/i), value);
  const changePasswordInput = (value) =>
    userEvent.type(utils.getByLabelText(/password/i), value);
  const clickSubmit = () => userEvent.click(utils.getByText(/submit/i));
  return {
    ...utils,
    handleSubmit,
    user,
    changeUsernameInput,
    changePasswordInput,
    clickSubmit,
  };
}

function setupSuccessCase() {
  const utils = setup();
  utils.changeUsernameInput(utils.user.username);
  utils.changePasswordInput(utils.user.password);
  utils.clickSubmit();
  return utils;
}

test("calls onSubmit with the username and password", () => {
  const { handleSubmit, user } = setupSuccessCase();
  expect(handleSubmit).toHaveBeenCalledTimes(1);
  expect(handleSubmit).toHaveBeenCalledWith(user);
});
```

### 抽象化のタイミング

1. **最初は重複を許容する**：小さなテストでは重複の方が理解しやすい
2. **問題が顕在化してから抽象化する**：実際に保守性の問題が出てから
3. **関数による抽象化を優先する**：beforeEach よりも純粋関数を使用
4. **合成可能な設計にする**：小さな関数を組み合わせて大きな機能を実現

## テストファイルの分割戦略

### describe による分割ではなく、ファイルによる分割を優先

```
❌ 1つの大きなファイルでdescribeによる分割
__tests__/
  user-management.test.js  // 500行、複数のdescribeブロック

✅ 機能ごとのファイル分割
__tests__/
  user-login.test.js       // 50行
  user-registration.test.js // 60行
  user-profile.test.js     // 40行
  helpers/
    user-test-utils.js     // 共通のヘルパー関数
```

### ファイル分割の利点

1. **論理的なグループ化**：関連する機能が明確に分離される
2. **独立したセットアップ**：各ファイルで必要な準備処理のみ記述
3. **認知負荷の軽減**：作業対象の機能に集中できる
4. **並列実行の最適化**：テストフレームワークがファイル単位で並列実行可能

## クリーンアップの適切な使用

### afterEach を使用すべき場面

```javascript
// ✅ グローバル環境の変更が必要な場合
afterEach(() => {
  cleanup(); // React Testing Library のDOM クリーンアップ
});

// ✅ テスト失敗時にも実行が必要な処理
let server;
beforeAll(async () => {
  server = await startServer();
});
afterAll(() => server.close());

// ✅ console.error のモック化
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  console.error.mockClear();
});
afterAll(() => {
  console.error.mockRestore();
});
```

### 避けるべき使用方法

```javascript
// ❌ 単なるコード再利用のためのbeforeEach
beforeEach(() => {
  handleSubmit = jest.fn(); // これは各テスト内で定義すべき
  user = { username: "test", password: "test" };
});
```
