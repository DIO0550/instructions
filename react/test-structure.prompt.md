# テスト構造のベストプラクティス

**Keywords**: test, testing, structure, nesting, flat, kent-c-dodds, avoid-nesting, file-separation

## 🔴 最重要原則：フラット構造 + ファイル分割

**🚨 絶対ルール**:

1. **フラット構造**：`describe`によるネストは基本的に使用しない
2. **ファイル分割**：機能ごとに独立したテストファイルを作成する
3. **自己完結テスト**：各テストは独立して理解でき、他のテストに依存しない

この 2 つの組み合わせが、保守性・可読性・実行性の高いテストスイートを実現する。

## ⚡ なぜフラット構造 + ファイル分割なのか

### フラット構造の利点

1. **認知負荷の軽減**：ネストレベルを追跡する必要がない
2. **テストの独立性**：各テストが自己完結している
3. **デバッグの容易性**：失敗したテストの特定が瞬時にできる
4. **並列実行の最適化**：テストランナーが効率的に動作

### ファイル分割の利点

1. **責務の明確化**：1 ファイル＝ 1 機能で責務が明確
2. **作業効率の向上**：関連するテストのみに集中できる
3. **並列処理の最適化**：ファイル単位で並列実行可能
4. **コード量の適正化**：50-150 行程度の管理しやすいサイズ

### 組み合わせの効果

- **🎯 最高の開発体験**：必要な情報だけに集中
- **🚀 最速の実行速度**：並列処理とキャッシュが最適化
- **🔧 最高の保守性**：変更影響が局所的に留まる

## 🏗️ 理想的なテスト構造（推奨パターン）

```
__tests__/
├── user-login.test.js           # ログイン機能（フラット構造）
├── user-registration.test.js    # ユーザー登録（フラット構造）
├── user-profile.test.js         # プロフィール管理（フラット構造）
├── password-reset.test.js       # パスワードリセット（フラット構造）
├── email-verification.test.js   # メール認証（フラット構造）
└── helpers/
    └── user-test-utils.js       # 共通ヘルパー関数
```

### 各ファイルの構造例

```javascript
// user-login.test.js - 完全にフラット、describeなし
test("有効な認証情報でログインすると認証トークンが返される", () => {
  const credentials = { email: "test@example.com", password: "validPassword" };
  const result = login(credentials);
  expect(result.token).toBeDefined();
  expect(result.user.email).toBe("test@example.com");
});

test("無効なメールアドレスでログインするとValidationErrorが発生する", () => {
  const credentials = { email: "invalid-email", password: "validPassword" };
  expect(() => login(credentials)).toThrow(ValidationError);
});

test("空のパスワードでログインするとValidationErrorが発生する", () => {
  const credentials = { email: "test@example.com", password: "" };
  expect(() => login(credentials)).toThrow(ValidationError);
});

test("存在しないユーザーでログインするとAuthenticationErrorが発生する", () => {
  const credentials = {
    email: "nonexistent@example.com",
    password: "password",
  };
  expect(() => login(credentials)).toThrow(AuthenticationError);
});
```

## ❌ 絶対に避けるべきパターン

### パターン 1: describe による構造化

```javascript
// ❌ describeを使った構造化（避けるべき）
describe("ユーザー管理", () => {
  describe("ログイン機能", () => {
    describe("正常系", () => {
      test("ログインが成功する", () => {});
    });
    describe("異常系", () => {
      test("ログインが失敗する", () => {});
    });
  });

  describe("登録機能", () => {
    describe("正常系", () => {
      test("登録が成功する", () => {});
    });
  });
});
```

**問題点**:

- ネストが深く、認知負荷が高い
- テスト名が不明確（どんな条件で何が起きるかが分からない）
- beforeEach による状態共有の温床になりやすい
- 1 つのファイルが巨大になる

### パターン 2: 巨大な単一ファイル

```javascript
// ❌ 1つのファイルに全機能（避けるべき）
// user-management.test.js (500行)
describe("ユーザー管理システム", () => {
  // ログイン関連のテスト 100行
  // 登録関連のテスト 150行
  // プロフィール関連のテスト 100行
  // パスワードリセット関連のテスト 100行
  // その他 50行
});
```

**問題点**:

- ファイルが巨大で管理困難
- 複数の機能が混在
- 並列実行の効率が悪い
- 変更時の影響範囲が大きい

## ✅ 推奨パターンの詳細

### 1. ファイル分割の基準

```javascript
// ✅ 機能別分割
user - login.test.js; // ログイン機能のみ
user - registration.test.js; // 登録機能のみ
user - profile - update.test.js; // プロフィール更新のみ
user - password - reset.test.js; // パスワードリセットのみ

// ✅ コンポーネント別分割（React）
LoginForm.test.js; // LoginFormコンポーネントのみ
RegistrationForm.test.js; // RegistrationFormコンポーネントのみ
UserProfile.test.js; // UserProfileコンポーネントのみ

// ✅ API別分割
user - api.test.js; // ユーザーAPI関連
auth - api.test.js; // 認証API関連
profile - api.test.js; // プロフィールAPI関連
```

### 2. テスト名の設計パターン

```javascript
// ✅ 完全な情報を含むテスト名
test("有効なメールアドレスと正しいパスワードでログインすると認証トークンが返される", () => {});
test("無効なメールアドレスでログインするとValidationErrorが発生する", () => {});
test("空のパスワードでログインするとValidationErrorがスローされる", () => {});
test("ロックされたアカウントでログインするとAccountLockedErrorが発生する", () => {});

// テンプレート: [入力条件]で[実行内容]すると[期待結果]
// - 入力条件: どのような状況・データで
// - 実行内容: 何の処理を実行すると
// - 期待結果: どのような結果になるか
```

### 3. テストの独立性の確保

```javascript
// ✅ 各テストで独立してセットアップ
test("有効なデータでユーザー登録すると新しいユーザーIDが返される", () => {
  // このテスト専用のデータ準備
  const userData = {
    email: "newuser@example.com",
    password: "securePassword123",
    name: "新規ユーザー",
  };

  // テスト実行
  const result = registerUser(userData);

  // アサーション
  expect(result.id).toBeDefined();
  expect(result.email).toBe(userData.email);
});

test("重複するメールアドレスで登録するとConflictErrorが発生する", () => {
  // このテスト専用のデータ準備（完全に独立）
  const existingEmail = "existing@example.com";
  createExistingUser({ email: existingEmail });

  const duplicateUserData = {
    email: existingEmail,
    password: "password123",
    name: "重複ユーザー",
  };

  // テスト実行とアサーション
  expect(() => registerUser(duplicateUserData)).toThrow(ConflictError);
});
```

## 🎯 実装戦略：段階的移行

### フェーズ 1: ファイル分割

```javascript
// Before: 巨大な単一ファイル
user-management.test.js (500行)

// After: 機能別分割
user-login.test.js (60行)
user-registration.test.js (80行)
user-profile.test.js (70行)
password-management.test.js (90行)
```

### フェーズ 2: describe 削除とフラット化

```javascript
// Before: ファイル内でdescribe使用
describe("ログイン機能", () => {
  test("成功する", () => {});
  test("失敗する", () => {});
});

// After: 完全フラット構造
test("有効な認証情報でログインすると認証トークンが返される", () => {});
test("無効なメールでログインするとValidationErrorが発生する", () => {});
```

### フェーズ 3: テスト独立性の確保

```javascript
// Before: beforeEachによる状態共有
let user;
beforeEach(() => {
  user = createTestUser();
});

// After: 各テストで独立してセットアップ
test("有効なユーザーでプロフィール更新すると更新内容が保存される", () => {
  const user = createTestUser(); // このテスト専用
  // テストロジック
});
```

## test vs it について

- **test** は **it** のエイリアスです
- **フラット構造では test を使用**：describe ブロック外では `test` を推奨（基本的にはこちらを使用）
- **例外的にネストした場合は it を使用**：describe ブロック内では `it` を使用（ただし、ネスト自体を避けることを強く推奨）
- **一貫性の維持**：プロジェクト内で統一した記述方法を採用する（基本は`test`で統一）

## 実践的な命名規則

**テスト名に必要な情報をすべて含める**ことで、describe の必要性を完全に排除する：## ⚠️ 重要原則：基本的に describe を使用しない

**🔴 最も重要なルール**: テストは基本的に**フラット構造**で記述し、`describe`によるネストは避ける。各テストは独立して理解でき、テストの目的が名前から即座に把握できるようにする。

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

## describe を使用すべき場面（例外的なケース）

> **重要**: 以下の場面でも、まずはフラット構造で解決できないかを検討し、どうしても必要な場合のみ使用する

- **関連するテストのグループ化**：明確に関連性があるテストケース群で、個別ファイルに分割するほどでもない場合
- **セットアップの共有**：beforeEach、beforeAll などでのテスト環境準備が複数のテストで必要で、関数による抽象化では対応困難な場合
- **テスト対象の明確化**：異なるコンポーネントや関数のテストを 1 つのファイル内で分離する必要がある場合（ただし、ファイル分割を優先検討）

## describe を避けるべき場面（基本方針）

- **単なる分類目的**：「正常系」「異常系」などの単純な分類（テスト名に含めるべき）
- **1 つしかテストがない場合**：describe 内にテストが 1 つしかない
- **過度な階層化**：3 レベル以上の深いネスト構造
- **コード再利用目的**：beforeEach でのセットアップが主目的（関数による抽象化を使用）

## フラット構造の利点

1. **可読性の向上**：テストの意図が明確になり、ネストを追跡する必要がない
2. **保守性の向上**：テストの追加・修正が容易になり、構造変更の影響を受けにくい
3. **実行効率**：テストランナーが効率的に実行でき、並列処理にも適している
4. **エラー特定の容易性**：失敗したテストの場所が特定しやすく、デバッグが簡単
5. **認知負荷の軽減**：ネストレベルを覚える必要がなく、テスト内容に集中できる
6. **テスト独立性の向上**：各テストが自己完結し、他のテストの影響を受けにくい

## 🎯 基本戦略：テスト分割を優先する

### ファイル分割 > describe 分割

```javascript
// ✅ 最優先：機能ごとにファイルを分割
__tests__ / user - login.test.js; // ログイン機能のテスト（フラット構造）
user - registration.test.js; // 登録機能のテスト（フラット構造）
user - profile.test.js; // プロフィール機能のテスト（フラット構造）

// ❌ 避ける：1つのファイルでdescribeによる分割
__tests__ / user - management.test.js; // 複数機能をdescribeで分割
```

## test vs it について

- **test** は **it** のエイリアスです
- **フラットな構造では test を使用**：describe ブロック外では `test` を推奨
- **ネストされた場合は it を使用**：describe ブロック内では `it` を使用（ただし、ネスト自体を避けることを推奨）
- **一貫性の維持**：プロジェクト内で統一した記述方法を採用する

## 実践的な命名規則

テスト名に必要な情報を含めることで、describe の必要性を減らす：

````javascript
```javascript
// ✅ 良い例：テスト名に十分な情報が含まれている（フラット構造、describeなし）
test("空の配列を渡した場合は空配列を返す", () => {});
test("数値の配列を渡した場合はソート済み配列を返す", () => {});
test("文字列を含む配列を渡した場合はTypeErrorをスローする", () => {});
test("nullを渡した場合はTypeErrorをスローする", () => {});
test("重複する数値を含む配列をソートして重複を保持する", () => {});

// ❌ 避けるべき例：describeによる構造化（情報も不足）
describe("sortNumbers関数", () => {
  describe("正常系", () => {
    test("ソートされた配列を返す", () => {}); // 何をソートするかが不明
  });
  describe("異常系", () => {
    test("エラーをスローする", () => {}); // どんな条件でどんなエラーかが不明
  });
});

// ❌ 特に避けるべき：過度なネスト
describe("ユーザー管理システム", () => {
  describe("認証機能", () => {
    describe("ログイン", () => {
      describe("正常系", () => {
        test("成功する", () => {}); // 情報が全く不足
      });
    });
  });
});
````

### テスト名の構成要素

優れたテスト名には以下の要素を含める：

1. **入力条件**：「どのような状況で」
2. **実行内容**：「何を実行すると」
3. **期待結果**：「どうなるか」

```javascript
// テンプレート：「[入力条件]で[実行内容]すると[期待結果]」
test("有効なメールアドレスでユーザー登録すると登録成功メッセージが表示される", () => {});
test("重複するメールアドレスでユーザー登録するとConflictErrorが発生する", () => {});
test("空のパスワードでログインするとValidationErrorが発生する", () => {});
```

## 🛠️ ヘルパー関数による抽象化

### 基本原則: beforeEach より関数を選ぶ

```javascript
// ❌ beforeEachによる状態共有
describe("ユーザー機能", () => {
  let user, mockService;

  beforeEach(() => {
    user = createTestUser();
    mockService = jest.fn();
  });

  test("テスト1", () => {
    // userとmockServiceがどこから来ているか追跡が必要
  });
});

// ✅ ヘルパー関数による明示的な準備
function createLoginTestSetup() {
  return {
    validUser: { email: "test@example.com", password: "password123" },
    mockAuthService: jest.fn(),
    mockTokenStorage: jest.fn(),
  };
}

test("有効な認証情報でログインすると認証トークンがストレージに保存される", () => {
  const { validUser, mockAuthService, mockTokenStorage } =
    createLoginTestSetup();
  mockAuthService.mockReturnValue({ token: "valid-token" });

  const result = login(validUser, mockAuthService, mockTokenStorage);

  expect(mockTokenStorage).toHaveBeenCalledWith("valid-token");
  expect(result.success).toBe(true);
});
```

### 組み合わせ可能なヘルパー

```javascript
// helpers/user-test-utils.js
export function createValidUser(overrides = {}) {
  return {
    email: "test@example.com",
    password: "password123",
    name: "テストユーザー",
    ...overrides,
  };
}

export function createInvalidEmailUser() {
  return createValidUser({ email: "invalid-email" });
}

export function createEmptyPasswordUser() {
  return createValidUser({ password: "" });
}

export function setupAuthMocks() {
  return {
    authService: jest.fn(),
    tokenStorage: jest.fn(),
    userRepository: jest.fn(),
  };
}
```

```javascript
// user-login.test.js
import {
  createValidUser,
  createInvalidEmailUser,
  setupAuthMocks,
} from "./helpers/user-test-utils";

test("有効な認証情報でログインすると認証が成功する", () => {
  const user = createValidUser();
  const { authService } = setupAuthMocks();
  authService.mockReturnValue({ success: true, token: "token123" });

  const result = login(user, authService);

  expect(result.success).toBe(true);
  expect(result.token).toBe("token123");
});

test("無効なメールでログインするとValidationErrorが発生する", () => {
  const user = createInvalidEmailUser();
  const { authService } = setupAuthMocks();

  expect(() => login(user, authService)).toThrow(ValidationError);
});
```

## 🔥 例外的な describe 使用の判定基準

### 使用前チェックリスト

describe を使用する前に、**すべて**の項目を確認する：

- [ ] **ファイル分割で解決できないか？** (95%の場合、これで解決)
- [ ] **テスト名の改善で解決できないか？**
- [ ] **ヘルパー関数で解決できないか？**
- [ ] **本当にグループ化が必要か？**（単なる分類ではないか？）
- [ ] **1 つのファイルに留める明確な理由があるか？**

### 例外的に使用してもよい場面

```javascript
// ✅ 例外的に許可される場面：同一コンポーネントの異なるpropsパターン
// ComponentWithMultipleStates.test.js

describe("loading状態の場合", () => {
  // setup for loading state tests
  beforeEach(() => {
    mockApiCall.mockImplementation(() => new Promise(() => {})); // never resolves
  });

  test("スピナーが表示される", () => {});
  test("コンテンツが非表示になる", () => {});
});

describe("error状態の場合", () => {
  beforeEach(() => {
    mockApiCall.mockRejectedValue(new Error("API Error"));
  });

  test("エラーメッセージが表示される", () => {});
  test("リトライボタンが表示される", () => {});
});

// ただし、この場合でも以下の方が推奨される：
// ファイル分割: ComponentLoading.test.js, ComponentError.test.js
```

## 💡 まとめ：成功への道筋

### 🎯 短期目標（1-2 週間）

1. **新しいテストはフラット構造のみ**
2. **100 行を超えるテストファイルの分割開始**
3. **describe 使用前のチェックリスト導入**

### 🚀 中期目標（1-2 ヶ月）

1. **既存テストファイルの完全分割**
2. **全 describe ブロックの削除**
3. **ヘルパー関数への置き換え完了**

### 🏆 長期目標（継続的）

1. **新規参画者でも即座に理解できるテストスイート**
2. **並列実行による高速テスト実行**
3. **変更時の影響が局所的なテスト設計**

### 成功指標

```javascript
// Before: 認知負荷が高い構造
describe("UserManagement", () => {
  // +1 ネストレベル
  describe("Authentication", () => {
    // +1 ネストレベル
    describe("Login", () => {
      // +1 ネストレベル
      describe("Valid credentials", () => {
        // +1 ネストレベル = 計4レベル
        test("succeeds", () => {}); // テスト名が不明確
      });
    });
  });
});

// After: 認知負荷が低い構造
test("有効なメールアドレスとパスワードでログインすると認証トークンが返される", () => {
  // 1行でテストの内容が完全に理解できる
  // ネストレベル = 0
  // ファイル名: user-login.test.js (50行)
});
```

**結果**:

- 認知負荷: 4 レベル → 0 レベル
- テスト内容の理解: 10 秒 → 1 秒
- ファイルサイズ: 500 行 → 50 行
- 保守性: 低 → 高
- 実行速度: 遅 → 高速

この構造により、**最高の開発体験と最短の開発サイクル**を実現できる。

// ❌ 避けるべき例：describe による構造化（情報も不足）
describe("sortNumbers 関数", () => {
describe("正常系", () => {
test("ソートされた配列を返す", () => {}); // 何をソートするかが不明
});
describe("異常系", () => {
test("エラーをスローする", () => {}); // どんな条件でどんなエラーかが不明
});
});

// ❌ 特に避けるべき：過度なネスト
describe("ユーザー管理システム", () => {
describe("認証機能", () => {
describe("ログイン", () => {
describe("正常系", () => {
test("成功する", () => {}); // 情報が全く不足
});
});
});
});

````

### テスト名の構成要素

優れたテスト名には以下の要素を含める：

1. **入力条件**：「どのような状況で」
2. **実行内容**：「何を実行すると」
3. **期待結果**：「どうなるか」

```javascript
// テンプレート：「[入力条件]で[実行内容]すると[期待結果]」
test("有効なメールアドレスでユーザー登録すると登録成功メッセージが表示される", () => {});
test("重複するメールアドレスでユーザー登録するとConflictErrorが発生する", () => {});
test("空のパスワードでログインするとValidationErrorが発生する", () => {});
````

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

## 🏗️ テストファイルの分割戦略（最重要）

### ファイル分割を最優先 - describe は使わない

```
❌ 絶対に避ける：1つの大きなファイルでdescribeによる分割
__tests__/
  user-management.test.js  // 500行、複数のdescribeブロック
  └── describe("login", ...)
  └── describe("registration", ...)
  └── describe("profile", ...)

✅ 強く推奨：機能ごとのファイル分割（フラット構造）
__tests__/
  user-login.test.js       // 50行、describeなし
  user-registration.test.js // 60行、describeなし
  user-profile.test.js     // 40行、describeなし
  helpers/
    user-test-utils.js     // 共通のヘルパー関数
```

### 分割基準

1. **機能単位**：ログイン、登録、プロフィール更新など
2. **コンポーネント単位**：React コンポーネントごと
3. **API エンドポイント単位**：各 API の責務ごと
4. **ファイルサイズ**：100-150 行を超えたら分割を検討

### ファイル分割の利点

1. **論理的なグループ化**：関連する機能が明確に分離される
2. **独立したセットアップ**：各ファイルで必要な準備処理のみ記述
3. **認知負荷の軽減**：作業対象の機能に集中できる
4. **並列実行の最適化**：テストフレームワークがファイル単位で並列実行可能
5. **describe 不要**：ファイル名で機能が明確になるため、追加の構造化が不要
6. **保守性向上**：機能追加時に新しいファイルを作成するだけで済む

## ❌ describe 使用の典型的な落とし穴

### パターン 1：不必要な分類

```javascript
// ❌ 単純な分類でdescribeを使用（無意味）
describe("正常系", () => {
  test("有効なデータでユーザー登録が成功する", () => {});
});
describe("異常系", () => {
  test("無効なメールでエラーが発生する", () => {});
});

// ✅ テスト名に情報を含めてフラット化
test("有効なデータでユーザー登録が成功する", () => {});
test("無効なメールでユーザー登録するとValidationErrorが発生する", () => {});
```

### パターン 2：過度なネスト

```javascript
// ❌ ネストが深すぎる
describe("UserService", () => {
  describe("register method", () => {
    describe("when email is provided", () => {
      describe("and email is valid", () => {
        test("creates user successfully", () => {});
      });
    });
  });
});

// ✅ ファイル分割 + フラット構造
// user-service-register.test.js
test("有効なメールでユーザー登録すると登録成功する", () => {});
test("無効なメールでユーザー登録するとValidationErrorが発生する", () => {});
```

### パターン 3：beforeEach 依存

```javascript
// ❌ describe + beforeEachによる複雑な構造
describe("ログイン機能", () => {
  let mockUser;
  beforeEach(() => {
    mockUser = { email: "test@example.com", password: "password123" };
  });

  test("ログインが成功する", () => {
    // mockUserがどこから来ているかを追跡する必要がある
  });
});

// ✅ 各テストで独立してセットアップ
test("有効な認証情報でログインすると認証トークンが返される", () => {
  const mockUser = { email: "test@example.com", password: "password123" };
  // テスト内ですべて完結
});
```

## 💡 まとめ：基本原則

### 🔴 絶対原則

1. **describe は基本的に使用しない**
2. **テストはフラット構造で記述する**
3. **機能ごとにファイルを分割する**
4. **テスト名に必要な情報をすべて含める**

### 🟡 例外的な場合の判断基準

describe を使用する前に、以下をすべて検討したか？

- [ ] ファイル分割で解決できないか？
- [ ] 関数による抽象化で解決できないか？
- [ ] テスト名の改善で解決できないか？
- [ ] 本当にグループ化が必要か？

### ✅ 推奨パターン

- **小さなテストファイル**（50-150 行程度）
- **明確なテスト名**（条件 + 動作 + 結果）
- **独立したテスト**（他のテストに依存しない）
- **関数による抽象化**（beforeEach の代わり）

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

```

```
