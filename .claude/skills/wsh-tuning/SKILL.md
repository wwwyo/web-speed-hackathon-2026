---
name: wsh-tuning
description: Web Speed Hackathon のパフォーマンスチューニングガイド。Lighthouse スコア改善、INP/TBT 最適化、キャッシュ設計、画像最適化、レギュレーション遵守などの攻略知見を提供する。WSH の課題アプリを高速化する際、または Lighthouse ベースの Web パフォーマンス改善全般に使用。トリガー: 「WSH」「Web Speed Hackathon」「パフォーマンスチューニング」「Lighthouse スコア改善」「WSH攻略」
---

# Web Speed Hackathon 完全攻略スキル

CA社（サイバーエージェント）が開催する Web Speed Hackathon の攻略知見を体系化したスキル。「意図的に重く作られた Web アプリ」を高速化し、Lighthouse ベースのスコアで競う競技に特化。

## 勝ち筋の要約

1. **スコアリング仕様を先に読む** — 対象ページ数、重み、ゲート条件、動画/操作の評価軸を把握
2. **最初の数時間は「巨大バイト」と「意図的遅延」を潰す** — production build・不要 polyfill・sleep/delay・巨大 WASM/JSON
3. **キャッシュ設計を再構築** — no-store 全消し → 静的アセットに長期キャッシュ + immutable
4. **TBT/INP は再レンダリング地獄を止める** — pointer 追跡、ランタイム CSS 生成、hover/aspect の JS 実装
5. **レギュレーション遵守が最優先** — VRT/E2E/手動テスト、initialize、data-testid を"改善より先に"守る

---

## 採点軸の変遷

| 年 | 主要メトリクス | 特記事項 |
|---|---|---|
| 2020 | Lighthouse v6（FCP/SI/LCP/TTI/TBT/CLS） | "まずメトリクスを理解しろ"が主題 |
| 2022 | v8式（FCP/SI/LCP/TTI/TBT/CLS 重み付き合算） | VRT 通過が前提 |
| 2023 | ページ：FCP/SI/LCP/TBT/CLS、フロー：TBT/INP | INP が競技採点に初登場 |
| 2024 | 2023 を継承 | SW register 必須など計測成立条件が増加 |
| 2025 | ページ表示(900)+操作(200)+動画(100)=1200 | 表示200点未満だと後続採点しないゲート |

---

## 優先度付き最適化リスト

### P0: 最初にやること（初動 ~2h）

#### 意図的遅延の削除
- sleep/delay/jitter を全文検索して削除
- 動的 import / fetch の人工的な遅延を除去
- **効く指標**: FCP/LCP/TBT/INP

#### production build 化
```js
// webpack.config.js
module.exports = {
  mode: 'production',           // none → production
  devtool: 'source-map',       // inline-source-map → 別ファイル
  optimization: {
    splitChunks: { chunks: 'all' },  // 無効化されていたら復活
    minimize: true,
  },
}
```
- **効く指標**: FCP/LCP/TBT

#### 不要 polyfill の全削除
- Chrome 最新版で動けば良いので core-js/regenerator-runtime は不要
- **効く指標**: FCP/LCP/TBT

#### 巨大依存を外す
- FFmpeg WASM、ImageMagick WASM、@iconify/json、巨大 JSON など
- サーバーサイドへの移行 or 軽量代替への置き換え
- **効く指標**: FCP/LCP/TBT/INP

#### Cache-Control 再設計
```ts
// 静的アセットだけ長期キャッシュ
if (req.path.startsWith('/assets/')) {
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
}
```
- no-store / max-age=0 を外し、ハッシュ付きファイル名 + immutable で 304 往復も排除
- **効く指標**: FCP/LCP/動画スコア

### P1: 中盤（~8h）

#### 画像のランタイム変換を廃止
- /images のようなオンザフライ変換を殺し、事前生成（WebP/AVIF/リサイズ）に寄せる
- **効く指標**: LCP/転送量

#### CLS をゼロに近づける
- img に width/height 明示、SSR でレイアウト固定
- **効く指標**: CLS（v10 系では重み大）

#### 再レンダリング抑制
- pointer 追跡 + グローバル store 更新 → 全コンポーネント再レンダの構造を破壊
- hover / aspect ratio の JS 定期計算 → CSS へ移管
- **効く指標**: TBT/INP（INP は最悪値が致命傷）

### P2: 後半

#### API/DB 最適化
- N+1 除去、SQLite index 追加
- 不要なデータ取得を減らす
- **効く指標**: LCP/TBT/INP

#### SSR（正しく動くSSR）
- HTML を先に出して初期描画/CLS 改善
- Hydration エラーに注意
- **効く指標**: FCP/LCP/CLS

#### 動画スコア最適化（2025）
- playing までの時間を最小化
- playlist のかさ増し削除
- **効く指標**: 動画スコア

---

## 攻略タイムライン（2日想定）

```
初動（~2h）: scoring/regulation 読み込み → バイト最大箇所特定 → 意図的遅延除去
中盤（~8h）: production build & polyfill 削除 → Cache-Control 再設計 → 画像・フォント整理
後半（残り）: 再レンダリング削減 → API/DB最適化 → SSR/動画/回遊
最終: VRT/E2E/initialize チェック → 再計測（ブレ考慮、複数回の中央値）
```

---

## レギュレーション遵守チェックリスト

提出前に必ず確認する（速さより先に守る）:

- [ ] **initialize が動く** — `POST /api/v1/initialize` で DB が初期状態にリセットされること
- [ ] **VRT/E2E が通る** — `cd application/e2e && pnpm test` で全パス
- [ ] **手動テスト項目を満たす** — `docs/test_cases.md` の項目
- [ ] **data-testid を消していない** — ユーザーフロー計測に必要
- [ ] **Chrome 最新版で機能落ち/デザイン差分なし**
- [ ] **年度固有の要件** — SW register（2024）、fly.toml 変更禁止（2025）、SSE プロトコル維持など
- [ ] **シードの各種 ID は変更していない**

---

## よくある落とし穴と対策

### フロント/バック分離で /initialize を壊す
- 採点はフロント URL へ POST して初期化する前提
- 分離する場合は Proxy で POST を中継し、レスポンスをそのまま返す

### VRT 破壊で失格
- 公式レポートでも「上位がレギュ落ちしがち」と明言
- **対策**: 変更単位で VRT/E2E を回す

### "圧縮すれば速い" の罠
- SW 内の zstd 圧縮が CPU/メモリボトルネックになった実例あり
- **対策**: 圧縮コストをプロファイルし、CDN/事前生成/静的圧縮へ逃がす

### 再レンダリング地獄で INP が死ぬ
- pointer 追跡 + 状態更新 → 大量再レンダリングは定番の罠
- **対策**: 更新頻度を落とす、局所化、CSS で済むものは CSS

### スコアブレ
- 再計測で 25 点以上ブレることがある
- **対策**: 同一条件で複数回計測し中央値を見る

---

## 計測ツール

### ローカル計測
```bash
# scoring-tool での計測
cd scoring-tool && pnpm install
pnpm start --applicationUrl http://localhost:8080

# 特定の計測名のみ
pnpm start --applicationUrl http://localhost:8080 --targetName "計測名"
```

### DevTools
- **Performance**: Record and reload で負荷計測、改善前後の差分確認
- **Network**: キャッシュ無効 + スロットリング設定で配信問題を観察

### Node/V8 プロファイリング
```bash
node --prof server.js
node --prof-process isolate-0x*.log > processed.txt
```

---

## 実践ワークフロー

このスキルが呼ばれたら、以下の手順で進める:

1. **現状把握**: scoring/regulation ドキュメントを読み、採点仕様とゲート条件を確認
2. **ボトルネック特定**: webpack config、package.json の依存、サーバーの Cache-Control、意図的遅延を調査
3. **P0 施策の実行**: 上記の優先度リストに従い、効果の大きい順に改善
4. **リグレッション確認**: 各改善後に VRT/E2E を実行し、レギュレーション違反がないことを確認
5. **計測**: scoring-tool で計測し、改善効果を数値で確認
6. **反復**: P1 → P2 と進み、スコアを積み上げる

---

## 参考リンク

### 公式
- 2020 解説 Wiki: `https://github.com/CyberAgentHack/web-speed-hackathon-2020/wiki/`
- 2023 採点仕様: `https://github.com/CyberAgentHack/web-speed-hackathon-2023-scoring-tool/blob/main/docs/SCORING.md`
- 2024 課題: `https://github.com/CyberAgentHack/web-speed-hackathon-2024`
- 2025 採点仕様: `https://github.com/CyberAgentHack/web-speed-hackathon-2025/blob/main/docs/scoring.md`

### 上位者参加記
- 2025 優勝: `https://zenn.dev/shun_shobon/articles/173450f5bec890`
- 2025 キャッシュ戦略: `https://zenn.dev/ciffelia/articles/web-speed-hackathon-2025`
- 2024 優勝: `https://trap.jp/post/2170/`
- 2024 2位: `https://blog.p1ass.com/posts/web-speed-hackathon-2024/`

### ツール一次資料
- Lighthouse Performance Scoring: `https://developer.chrome.com/docs/lighthouse/performance/performance-scoring`
- INP: `https://web.dev/articles/inp`
- TBT: `https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time`
