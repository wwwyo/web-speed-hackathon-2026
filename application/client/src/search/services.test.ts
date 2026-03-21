import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { parseSearchQuery, isValidDate, sanitizeSearchText } from "./services";

describe("parseSearchQuery", () => {
  it("キーワードのみ", () => {
    const result = parseSearchQuery("アニメ");
    assert.equal(result.keywords, "アニメ");
    assert.equal(result.sinceDate, null);
    assert.equal(result.untilDate, null);
  });

  it("since付き", () => {
    const result = parseSearchQuery("アニメ since:2026-01-06");
    assert.equal(result.keywords, "アニメ");
    assert.equal(result.sinceDate, "2026-01-06");
    assert.equal(result.untilDate, null);
  });

  it("until付き", () => {
    const result = parseSearchQuery("アニメ until:2026-12-31");
    assert.equal(result.keywords, "アニメ");
    assert.equal(result.sinceDate, null);
    assert.equal(result.untilDate, "2026-12-31");
  });

  it("since + until付き", () => {
    const result = parseSearchQuery("アニメ since:2026-01-06 until:2026-12-31");
    assert.equal(result.keywords, "アニメ");
    assert.equal(result.sinceDate, "2026-01-06");
    assert.equal(result.untilDate, "2026-12-31");
  });

  it("キーワードなし、sinceのみ", () => {
    const result = parseSearchQuery("since:2026-01-01");
    assert.equal(result.keywords, "");
    assert.equal(result.sinceDate, "2026-01-01");
  });

  it("余分な文字があっても日付部分を抽出する(prefix match)", () => {
    const result = parseSearchQuery("アニメ since:2026-01-0600000x");
    assert.equal(result.keywords, "アニメ");
    assert.equal(result.sinceDate, "2026-01-06");
  });

  it("日付の後に余分な数字があっても日付部分を抽出する", () => {
    const result = parseSearchQuery("アニメ since:2026-01-060000");
    assert.equal(result.keywords, "アニメ");
    assert.equal(result.sinceDate, "2026-01-06");
  });

  it("空文字列", () => {
    const result = parseSearchQuery("");
    assert.equal(result.keywords, "");
    assert.equal(result.sinceDate, null);
    assert.equal(result.untilDate, null);
  });

  it("ReDoS入力でも高速に返る", () => {
    const start = performance.now();
    parseSearchQuery(`アニメ since:2026-01-06${"0".repeat(20)}x`);
    const elapsed = performance.now() - start;
    assert.ok(elapsed < 100, `took ${elapsed}ms, expected < 100ms`);
  });

  it("ReDoS入力(since+until)でも高速に返る", () => {
    const start = performance.now();
    parseSearchQuery(`アニメ since:2026-01-06${"0".repeat(10)}x until:2026-01-06${"0".repeat(10)}x`);
    const elapsed = performance.now() - start;
    assert.ok(elapsed < 100, `took ${elapsed}ms, expected < 100ms`);
  });
});

describe("isValidDate", () => {
  it("正常な日付", () => {
    assert.equal(isValidDate("2026-01-06"), true);
    assert.equal(isValidDate("2025-12-31"), true);
  });

  it("不正な日付フォーマット", () => {
    assert.equal(isValidDate("2026-99-99"), false);
    assert.equal(isValidDate("not-a-date"), false);
    assert.equal(isValidDate(""), false);
  });

  it("余分な数字が付いた日付", () => {
    assert.equal(isValidDate("2026-01-0600000"), false);
  });

  it("ReDoS入力でも高速に返る", () => {
    const start = performance.now();
    isValidDate(`${"1".repeat(30)}-${"2".repeat(30)}-${"3".repeat(30)}`);
    const elapsed = performance.now() - start;
    assert.ok(elapsed < 100, `took ${elapsed}ms, expected < 100ms`);
  });
});

describe("sanitizeSearchText", () => {
  it("from/untilのフォーマットを正規化", () => {
    assert.equal(sanitizeSearchText("from:2025-01-01"), "from:2025-01-01");
    assert.equal(sanitizeSearchText("until:2025-12-31"), "until:2025-12-31");
  });

  it("余分な数字を除去", () => {
    assert.equal(sanitizeSearchText("until:2025-12-31999"), "until:2025-12-31");
  });

  it("キーワードはそのまま", () => {
    assert.equal(sanitizeSearchText("アニメ"), "アニメ");
  });
});
