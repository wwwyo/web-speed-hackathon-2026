import fs from "node:fs";
import path from "node:path";

import { Router } from "express";
import serveStatic from "serve-static";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";
const HASHED_FILE_RE = /chunk-[0-9a-f]+\.js$/;

let cachedIndexHtml: string | null = null;

function getIndexHtml(): string {
  if (cachedIndexHtml != null) return cachedIndexHtml;
  cachedIndexHtml = fs.readFileSync(path.join(CLIENT_DIST_PATH, "index.html"), "utf-8");
  return cachedIndexHtml;
}

export const staticRouter = Router();

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    index: false,
    maxAge: "1d",
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    index: false,
    maxAge: "7d",
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    index: false, // index.html の自動配信を無効化（自前で返す）
    setHeaders(res, filePath) {
      const basename = path.basename(filePath);
      if (HASHED_FILE_RE.test(basename)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader("Cache-Control", "public, max-age=604800");
      }
    },
  }),
);

// SPA fallback: 静的ファイルにマッチしなかったリクエストに index.html を返す
staticRouter.use((_req, res) => {
  const html = getIndexHtml();
  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "no-cache");
  res.send(html);
});
