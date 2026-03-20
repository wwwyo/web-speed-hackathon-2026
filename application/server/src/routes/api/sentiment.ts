import { Router } from "express";
// @ts-expect-error -- no types
import analyze from "negaposi-analyzer-ja";

import { getTokenizer } from "@web-speed-hackathon-2026/server/src/utils/tokenizer";

export const sentimentRouter = Router();

sentimentRouter.get("/sentiment", async (req, res) => {
  const raw = typeof req.query["text"] === "string" ? req.query["text"].trim() : "";
  const text = raw.slice(0, 200);

  if (!text) {
    return res.status(200).type("application/json").send({ score: 0, label: "neutral" });
  }

  const tokenizer = await getTokenizer();
  const tokens = tokenizer.tokenize(text);
  const score: number = analyze(tokens);

  let label: "positive" | "negative" | "neutral";
  if (score > 0.1) {
    label = "positive";
  } else if (score < -0.1) {
    label = "negative";
  } else {
    label = "neutral";
  }

  return res.status(200).type("application/json").send({ score, label });
});
