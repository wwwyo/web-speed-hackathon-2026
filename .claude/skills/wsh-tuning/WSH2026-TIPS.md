# Web Speed Hackathon 2026 実践Tips

WSH 2026（架空SNS「CaX」）で実際に行った最適化の振り返りと、来年以降に活かせる知見をまとめる。

---

## 全体戦略

### スコア構成を最初に理解する

2026年は **表示 900点 + 操作 250点 = 最大 1150点**。表示で300点未満だと操作の採点が行われないゲート条件あり。

**教訓**: 操作(INP/TBT)をいくら改善しても表示が300点未満なら0点。まず表示スコアを安全圏に乗せることが最優先。

### 初動でやるべき3つ

1. **レギュレーション・採点仕様を熟読**（30分）
2. **`production` ビルド + ソースマップ無効化**（10分で+100点以上）
3. **意図的遅延（sleep/delay）の全文検索と削除**（30分）

この3つだけで表示ゲートを突破できる可能性が高い。

---

## カテゴリ別Tips

### 1. ビルド・バンドル最適化

#### Webpack → Rspack 移行
- Rspack は Webpack 互換で移行コストが低い。ビルド速度が劇的に改善し、開発サイクルが速くなる
- `mode: "production"`, `devtool: false`, `splitChunks: { chunks: 'all' }` を確認
- SWC ベースなので Babel 設定の移行は不要になる

#### コード分割は3段階で考える
1. **ルート単位** — `React.lazy + Suspense` で各ページを分割。最も効果が大きい
2. **重いライブラリ単位** — react-syntax-highlighter, KaTeX, markdown系は使うページのチャンクに閉じ込める
3. **機能単位** — 検索(kuromoji)、メディア変換(FFmpeg)など使用頻度の低い機能をdynamic import

#### ベンダーチャンク分離
```js
splitChunks: {
  chunks: 'all',
  cacheGroups: {
    vendor: {
      test: /[\\/]node_modules[\\/]/,
      name: 'vendor',
      chunks: 'all',
    },
  },
}
```
キャッシュ効率が上がり、アプリコード変更時にベンダーチャンクのキャッシュが活きる。

#### 不要な依存を積極的に削除
WSH2026で削除・置換した依存:

| 削除対象 | 代替 | 削減効果 |
|---------|------|---------|
| jQuery | fetch API | ~90KB |
| lodash | ネイティブ Array メソッド | ~70KB |
| moment.js | Intl API | ~70KB |
| bluebird | native Promise | ~20KB |
| classnames | 自前ユーティリティ(10行) | ~2KB |
| react-helmet | React 19 ネイティブ `<title>` | ~10KB |
| standardized-audio-context | 削除(Chrome最新なら不要) | ~50KB |
| redux-form | useState + blur validation | ~30KB |
| buffer (ProvidePlugin) | 削除(未使用) | ~50KB |

**Tip**: `npx depcheck` や Rsdoctor で未使用・重い依存を特定する。Chrome最新前提なのでポリフィル系は大体不要。

---

### 2. 画像・メディア最適化

#### 画像
- **WebP 変換 + リサイズ**: シード画像を事前に WebP + 適切サイズに変換。ランタイム変換は厳禁
- **200KB超は再圧縮**: 品質70で1/2リサイズが安全ライン（VRT通過確認必須）
- **LCP 画像**: `fetchpriority="high"` + `loading="eager"` を明示。ファーストビューの画像は640px幅程度で十分
- **GIF → MP4/WebM**: video タグ化で大幅に軽量化。autoplay + muted + loop + playsinline
- **バイナリ取得の廃止**: `<img src="/api/images/xxx">` のように直接URLを叩く。blob URL生成は不要

#### 音声・動画
- **preload="none"**: 自動再生しないメディアは明示。LCP改善に効く
- **波形データの事前計算**: 音声の波形表示を毎回クライアントで計算するのではなく、DBに事前保存
- **FFmpeg WASM のサーバー移行**: メディア変換はサーバーサイドで行い、クライアントから FFmpeg WASM を完全除去

#### フォント
- **WOFF2 変換**: TTF/OTF → WOFF2 で 30-50% 削減
- **font-display: swap**: FOIT 防止
- **SVG sprite の使用アイコン絞り込み**: FontAwesome 等のフルセットから実際に使うアイコンだけ抽出

---

### 3. CSS 最適化

#### Tailwind CSS CDN → ビルド時生成
- CDN版は全ユーティリティを含む巨大CSS。ビルド時にPurgeすれば数KB
- PostCSS + Tailwind v4 のビルドパイプラインを整備

#### KaTeX CSS の遅延ロード
- 数式を使うページ(Crok)以外では KaTeX CSS/フォントを読み込まない
- `React.lazy` の境界で CSS も一緒に `Promise.all()` で読み込む

#### CSS チャンク分割
- ルート単位で CSS も分割し、不要なページの CSS を初期ロードから外す

---

### 4. キャッシュ設計

```
静的アセット（/assets/*, ハッシュ付き）:
  Cache-Control: public, max-age=31536000, immutable

API レスポンス:
  Cache-Control: no-cache（必要に応じて stale-while-revalidate）

HTML:
  Cache-Control: no-cache
```

**重要**: WSHの課題アプリは `no-store` や `max-age=0` がハードコードされていることが多い。全部探して書き換える。

---

### 5. 重い処理のサーバーサイド移行

WSH では「ブラウザでやる必要のない重い処理」がクライアントに載せられている。これをサーバーに移すだけで大幅改善。

| 処理 | 移行前 | 移行後 |
|-----|-------|-------|
| 画像変換 | ImageMagick WASM (~5MB) | サーバーサイド sharp/ImageMagick |
| 動画変換 | FFmpeg WASM (~25MB) | サーバーサイド ffmpeg |
| 音声変換 | FFmpeg WASM | サーバーサイド ffmpeg |
| 翻訳(LLM) | web-llm (~数百MB) | サーバーサイド API |
| 検索/サジェスト | kuromoji (~20MB辞書) | サーバーサイド API |
| 音声波形計算 | AudioContext + fetch | DB事前計算 |

**Tip**: Fly.io の 1CPU/2GB でも ffmpeg や sharp は十分動く。タイムアウトだけ注意（30秒程度に設定）。

---

### 6. DB・API 最適化

#### SQLite インデックス
```sql
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_direct_messages_conversation_id ON direct_messages(conversation_id);
```
N+1 が解消しないときでも、インデックスがあれば個々のクエリが速くなる。

#### N+1 解消
- Sequelize の `include` で eager load。ただし全メッセージを eager load するような過剰取得は逆効果
- afterSave フック内のクエリが N+1 になりがち。バルク操作に書き換える

#### 無限スクロールの初回取得数
- 30件 → 3件に削減するだけで初期レスポンスが劇的に軽くなる。ユーザー体験的にも問題なし

---

### 7. React レンダリング最適化

#### React.memo の正しい使い方
```tsx
// NG: オブジェクト props は毎回新規参照
<TimelineItem post={post} />

// OK: primitive に分解
<TimelineItem
  id={post.id}
  text={post.text}
  userName={post.user.name}
  createdAt={post.createdAt}
/>
```
API fetch 由来のデータはレスポンスのたびに新規オブジェクトになるため、モデル全体を渡すと memo が効かない。

#### redux-form → useState 化
- redux-form は毎キー入力で store 更新 → 全コンポーネント再レンダリング
- `useState` + blur/submit時のみ validation に書き換えると TBT/INP が大幅改善
- Unicode 正規表現を含む重い validation は `blur` 時だけ走らせる

#### startTransition の活用
- Markdown パース、検索結果更新など「急がない更新」を `startTransition` で包む
- メインスレッドの応答性が維持され INP が改善

#### AppContainer の認証ブロッキング解除
- `/api/v1/me` の完了まで空JSXを返すと全画面が白くなりLCPが悪化
- 認証待ち中も Navigation/レイアウトは描画し、auth依存ページだけ gate する

#### FastAverageColor 等のメインスレッドブロック
- 画像の平均色計算などがメインスレッドを数百msブロックすることがある
- Web Worker に逃がすか、事前計算してDB/CSSに持つ

---

### 8. SPA ナビゲーション

#### react-router の Link コンポーネント
- `<a href="...">` → `<Link to="...">` に置換するだけでSPAナビゲーションが有効になる
- ページ遷移のたびにフルリロードが走る問題を解消

#### scrollbar-gutter: stable
- SPA遷移時にスクロールバーの有無で横幅がシフトする問題を CSS 一行で解消

---

### 9. セキュリティ・安定性

#### ReDoS 正規表現の修正
- `/(a+)+/` のようなバックトラッキング爆発を起こす正規表現がないか確認
- 入力バリデーションの正規表現は特に注意

---

## 時間配分テンプレート（1日競技の場合）

```
[0:00-0:30] レギュレーション・採点仕様読み込み + 環境構築
[0:30-1:00] production build + ソースマップ無効 + 意図的遅延削除 → 初回計測
[1:00-2:00] 巨大依存の特定と削除/dynamic import化
[2:00-3:00] 画像最適化（WebP変換 + リサイズ + LCP fetchpriority）
[3:00-4:00] キャッシュ設計 + フォント最適化
[4:00-5:00] コード分割（ルート単位 → ライブラリ単位）
[5:00-6:00] 重い処理のサーバー移行（画像変換、メディア変換）
[6:00-7:00] React レンダリング最適化（memo, useState化, startTransition）
[7:00-7:30] DB最適化（インデックス, N+1解消）
[7:30-8:00] 最終計測 + VRT/E2E確認 + レギュレーションチェック
```

---

## やってよかったことランキング

効果の大きかった順（体感）:

1. **production build + ソースマップ無効化** — 一瞬で数百点改善
2. **FFmpeg/ImageMagick WASM のサーバー移行** — 初期バンドルから巨大WASMが消える
3. **ルート単位のコード分割** — 各ページで必要なJSだけ読む
4. **画像 WebP 変換 + リサイズ** — LCP直接改善
5. **redux-form → useState** — TBT/INPが劇的改善
6. **不要依存の削除（jQuery, lodash, moment等）** — 塵も積もれば
7. **キャッシュ設計の再構築** — 2回目以降の計測が安定
8. **React.memo の primitive props 化** — リスト表示のINP改善
9. **KaTeX/syntax-highlighter の遅延ロード** — 特定ページ以外の軽量化
10. **SQLite インデックス追加** — API応答速度の底上げ

---

## やらなくてよかったこと・注意点

- **SSR は投資対効果が低い場合がある** — SPA前提のアプリにSSRを入れるとHydrationエラーとの戦いになる。SPAのままコード分割で十分なケースが多い
- **Service Worker は慎重に** — 過去大会でSW内の圧縮がボトルネックになった事例あり
- **過度なCSS最適化** — Critical CSS抽出等は手間の割に効果が薄い。まずJSバンドルを減らすほうが効く
- **VRT を後回しにしない** — 改善のたびに VRT を回す。最後にまとめて確認すると手戻りが巨大になる

---

## Claude Code との協業Tips

### Ralph ワークフローが有効
- PRD（Product Requirements Document）を JSON で定義し、1ストーリーずつ自動実装→テスト→コミット
- 人間は方針決定とレビューに集中できる

### E2E テストをこまめに回す
- `cd application/e2e && pnpm test` を変更のたびに実行
- VRT が落ちたら即修正。後回しにすると原因特定が困難

### AGENTS.md にチューニング知見を蓄積
- 実際に効果があった最適化パターンを AGENTS.md に追記
- 次の作業で同じ調査をスキップできる

### スキルファイルの活用
- `.claude/skills/` にドメイン知識をまとめておくと、Claude Code が文脈を持って作業できる
- 「wsh-tuning」のようなスキルを呼ぶだけで最適化の進め方を思い出せる

---

## 来年への宿題

- [ ] AVIF 対応の検討（WebP より更に軽量だがブラウザ対応を確認）
- [ ] Bun / Deno への移行可能性（サーバー起動速度の改善）
- [ ] View Transitions API の活用（SPA遷移のUX向上）
- [ ] Speculation Rules API による先読み
- [ ] Rspack の Module Federation 活用可能性
- [ ] INP 最適化の更なる深掘り（Interaction to Next Paint は Chrome チームが注力中）
