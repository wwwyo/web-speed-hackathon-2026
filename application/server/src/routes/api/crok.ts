import fs from "node:fs";
import path from "node:path";

import { BM25 } from "bayesian-bm25";
import { Router } from "express";
import httpErrors from "http-errors";

import suggestionsData from "@web-speed-hackathon-2026/server/src/data/suggestions.json" with { type: "json" };
import { extractTokens, getTokenizer } from "@web-speed-hackathon-2026/server/src/utils/tokenizer";

export const crokRouter = Router();

const response = fs.readFileSync(path.join(import.meta.dirname, "crok-response.md"), "utf-8");

// BM25 インデックスを事前構築
const bm25 = new BM25({ k1: 1.2, b: 0.75 });
bm25.index(suggestionsData.map((s) => s.tokens));

crokRouter.get("/crok/suggestions", async (req, res) => {
  const q = typeof req.query["q"] === "string" ? req.query["q"].trim() : "";

  if (!q) {
    res.json({ suggestions: suggestionsData.map((s) => s.question), queryTokens: [] });
    return;
  }

  const tokenizer = await getTokenizer();
  const queryTokens = extractTokens(tokenizer.tokenize(q));

  if (queryTokens.length === 0) {
    res.json({ suggestions: [], queryTokens: [] });
    return;
  }

  const scores = bm25.getScores(queryTokens) as number[];
  const results = suggestionsData
    .map((s, i) => ({ text: s.question, score: scores[i]! }))
    .filter((s) => s.score > 0)
    .sort((a, b) => a.score - b.score)
    .slice(-10)
    .map((s) => s.text);

  res.json({ suggestions: results, queryTokens });
});

crokRouter.get("/crok", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let messageId = 0;

  for (const char of response) {
    if (res.closed) break;

    const data = JSON.stringify({ text: char, done: false });
    res.write(`event: message\nid: ${messageId++}\ndata: ${data}\n\n`);
  }

  if (!res.closed) {
    const data = JSON.stringify({ text: "", done: true });
    res.write(`event: message\nid: ${messageId}\ndata: ${data}\n\n`);
  }

  res.end();
});
