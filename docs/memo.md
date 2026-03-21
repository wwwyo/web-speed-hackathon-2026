# デプロイトラブルシューティングメモ

## 502 Bad Gateway の原因と対応（2026-03-21）

### 1. negaposi-analyzer-ja 辞書欠落

- `negaposi-analyzer-ja` は辞書ファイル（`pn_ja.dic.json`）を npm パッケージに同梱せず、`postinstall` で外部 URL からダウンロードする設計
- Docker ビルド時にダウンロード失敗 → サーバー起動時にクラッシュ
- **対応**: ライブラリのロジックを `sentiment.ts` に直接実装し、辞書を `server/src/data/pn_ja.dic.json` に同梱。`negaposi-analyzer-ja` 依存を削除
- 補足: 元のライブラリは `dict["posi"]` と `token["posi"]` を比較していたが、辞書キーは `pos`、kuromoji トークンも `pos` なので両方 `undefined` → 比較が常に true → 実質 `surface` + `reading` の2条件マッチだった

### 2. sqlite3 ネイティブバインディング問題

- `sqlite3@5.1.7` は `prebuild-install@7.1.2` に依存。Node 24（N-API v10）で N-API バージョンの文字列比較バグ（`"10" < "9"`）により prebuilt ダウンロード失敗
- `sqlite3@6.0.1` にアップデートしたが、prebuilt バイナリが GLIBC 2.38 を要求。`node:24-slim`（Debian bookworm）は GLIBC 2.36 のため `dlopen` 失敗
- **対応**: Dockerfile に `build-essential` + `python3` を追加し、`npm_config_build_from_source=true` でソースからビルド。実行環境の glibc に合ったバイナリが生成される

### 3. Dockerfile の変更点

元の Dockerfile からの差分:
- `build-essential` + `python3` をビルドステージに追加（sqlite3 ソースビルド用）
- `npm_config_build_from_source=true` を `pnpm install` に付与（prebuilt スキップ）
- `pnpm install --prod` を削除（ネイティブバインディング消失防止）

### 4. Fly.io デバッグ

- `--access-token` フラグは flyctl で無視される。`FLY_API_TOKEN` 環境変数で渡す
- アプリ名は `pr-54-web-speed-hackathon-2026`
- ログは read-only トークンで取得可能（`docs/token.txt` 参照）
