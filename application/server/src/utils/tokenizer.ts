import path from "node:path";

import kuromoji, { type Tokenizer, type IpadicFeatures } from "kuromoji";

import { PUBLIC_PATH } from "@web-speed-hackathon-2026/server/src/paths";

let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;

export function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (!tokenizerPromise) {
    tokenizerPromise = new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath: path.join(PUBLIC_PATH, "dicts") }).build((err, tokenizer) => {
        if (err) reject(err);
        else resolve(tokenizer);
      });
    });
  }
  return tokenizerPromise;
}

const STOP_POS = new Set(["助詞", "助動詞", "記号"]);

export function extractTokens(tokens: IpadicFeatures[]): string[] {
  return tokens
    .filter((t) => t.surface_form !== "" && t.pos !== "" && !STOP_POS.has(t.pos))
    .map((t) => t.surface_form.toLowerCase());
}
