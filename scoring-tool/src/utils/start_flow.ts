import { startFlow as startFlowOrig } from "lighthouse";
import type * as puppeteer from "puppeteer";

export async function startFlow(page: puppeteer.Page) {
  return startFlowOrig(page, {
    config: {
      extends: "lighthouse:default",
      settings: {
        disableFullPageScreenshot: true,
        disableStorageReset: true,
        formFactor: "desktop",
        maxWaitForFcp: 120 * 1000,
        maxWaitForLoad: 180 * 1000,
        // onlyAudits を外して全 audit を実行（Diagnostics/Opportunities を含むレポート生成のため）
        // スコア計算は calculate_hackathon_score.ts で6メトリクスのみ使用するため結果に影響なし
        screenEmulation: {
          disabled: true,
        },
        throttlingMethod: "simulate",
      },
    },
  }).catch(() => Promise.reject(new Error("Lighthouse がタイムアウトしました")));
}
