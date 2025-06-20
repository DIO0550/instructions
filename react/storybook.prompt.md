# Storybook Story ファイルルール

## 基本ルール

- **ファイル名規則**：`ComponentName.stories.tsx` の形式を使用する
- **デフォルトエクスポート**：Meta オブジェクトをデフォルトエクスポートで定義する
- **Story の定義**：名前付きエクスポートで各ストーリーを定義する
- **型定義**：`Meta<typeof Component>` と `StoryObj<typeof Component>` を適切に使用する
- **Args の活用**：コンポーネントの props は args として定義し、再利用可能にする
- **関数型 Args**：イベントハンドラーなどの関数型 props は `fn()` を使用する
- **Title 設定**：Meta オブジェクトに title は設定しない（ファイルパスから自動生成される）
- **Controls の設定**：Storybook Controls でプロパティを動的に変更できるよう適切に設定する
- **アクセシビリティ**：a11y アドオンでアクセシビリティをテストできるよう考慮する

## Story の種類

- **Default**：最も基本的な使用例を示すストーリー
- **All Props**：すべての props を設定した状態を示すストーリー
- **Edge Cases**：境界値や特殊な状態を示すストーリー
- **Interactive**：ユーザーインタラクションを含むストーリー（必要に応じて）

## 推奨事項

- **ドキュメント**：コンポーネントの使用方法を説明する docs を記述する
- **Play 関数**：複雑なインタラクションは play 関数で自動化する
- **Decorator**：共通のラッパーやスタイルは decorators で適用する
- **Parameters**：ストーリー固有の設定は parameters で定義する
- **CSF3.0**：Component Story Format 3.0 の記法を使用する

## 禁止事項

- **ビジネスロジック**：Story 内でビジネスロジックを実装しない
- **外部依存**：API 呼び出しや外部サービスへの直接的な依存を避ける
- **重複コード**：Similar な Story 間でのコードの重複を避ける

## 備考

- コメントルールは、[comment.prompt.md]("./comment.prompt.md")に従う
- 基本ルールは、[standard.prompt.md]("./standard.prompt.md")に従う
- コンポーネントルールは、[component.prompt.md]("./component.prompt.md")に従う
