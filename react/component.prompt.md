# コンポーネントルール

## 基本ルール

- 関数コンポーネントを使用する
  - React.FC は使用せず、JSX.Element を返す関数として定義する
  - 再描画のコストが高い場合は React.memo を使用する
- コンポーネントが受け取る Props は、同ファイル内で type Props として定義する
- 単一責任の原則に従い、1 つのコンポーネントは 1 つの責任のみを持つ
- 適切なコメントと JSDoc を記述する
- ビジネスロジックは custom hooks に抽出して再利用する
- 同ファイルに story ファイルを作成し、見た目の確認を行えるようにする
  - story ファイルの拡張子は .stories.tsx を使用する
  - ただし動作の確認は、vitest で確認できるようにする
- 命名規則は PascalCase でコンポーネント名、camelCase で props/変数名を使用する
- アクセシビリティ（a11y）を考慮したマークアップを使用する（aria 属性、semantic HTML 等）
- デフォルト props が必要な場合は、関数のデフォルト引数で定義する
- 条件付きレンダリングでは、論理演算子（&&）よりも三項演算子を優先する
  - ネストが深くなる場合は、別コンポーネントに切り出す
- key prop をリスト要素に適切に設定し、インデックスは避ける

## 備考

- コメントルールは、[comment.prompt.md]("./comment.prompt.md")に従う
- テストルールは、[vitest.prompt.md]("./vitest.prompt.md")に従う
- 基本ルールは、[standard.prompt.md]("./standard.prompt.md")に従う
- カスタムフックは、[custom-hook.prompt.md]("./custom-hook.prompt.md")に従う
