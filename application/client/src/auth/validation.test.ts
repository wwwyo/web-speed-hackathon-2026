import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { validate } from "./validation";

const base = { type: "signin" as const, username: "testuser", name: "", password: "pass!word" };

describe("auth validate - パスワード", () => {
  it("記号を含むパスワードはエラーなし", () => {
    const errors = validate({ ...base, password: "abc!def" });
    assert.equal(errors.password, undefined);
  });

  it("記号を含むパスワード（ハイフン）", () => {
    const errors = validate({ ...base, password: "wsh-2026" });
    assert.equal(errors.password, undefined);
  });

  it("記号を含むパスワード（アンダースコア）", () => {
    const errors = validate({ ...base, password: "super_ultra" });
    assert.equal(errors.password, undefined);
  });

  it("英数字のみのパスワードはエラー", () => {
    const errors = validate({ ...base, password: "abcdefgh" });
    assert.equal(errors.password, "パスワードには記号を含める必要があります");
  });

  it("数字のみのパスワードはエラー", () => {
    const errors = validate({ ...base, password: "12345678" });
    assert.equal(errors.password, "パスワードには記号を含める必要があります");
  });

  it("日本語文字のみのパスワードはエラー", () => {
    const errors = validate({ ...base, password: "パスワード" });
    assert.equal(errors.password, "パスワードには記号を含める必要があります");
  });

  it("空パスワードは入力エラー", () => {
    const errors = validate({ ...base, password: "" });
    assert.equal(errors.password, "パスワードを入力してください");
  });

  it("スペースのみのパスワードは入力エラー", () => {
    const errors = validate({ ...base, password: "   " });
    assert.equal(errors.password, "パスワードを入力してください");
  });

  it("ReDoS入力でも高速に返る", () => {
    const start = performance.now();
    validate({ ...base, password: "superultra_hyper_miracle_romantic" });
    const elapsed = performance.now() - start;
    assert.ok(elapsed < 100, `took ${elapsed}ms, expected < 100ms`);
  });

  it("長い英数字文字列 + 末尾記号でも高速に返る", () => {
    const start = performance.now();
    validate({ ...base, password: "a".repeat(100) + "!" });
    const elapsed = performance.now() - start;
    assert.ok(elapsed < 100, `took ${elapsed}ms, expected < 100ms`);
  });
});

describe("auth validate - ユーザー名", () => {
  it("英数字とアンダースコアはOK", () => {
    const errors = validate({ ...base, username: "test_user_123" });
    assert.equal(errors.username, undefined);
  });

  it("空ユーザー名はエラー", () => {
    const errors = validate({ ...base, username: "" });
    assert.equal(errors.username, "ユーザー名を入力してください");
  });

  it("記号を含むユーザー名はエラー", () => {
    const errors = validate({ ...base, username: "user@name" });
    assert.equal(errors.username, "ユーザー名に使用できるのは英数字とアンダースコア(_)のみです");
  });
});

describe("auth validate - 名前 (signup)", () => {
  it("signupで名前が空はエラー", () => {
    const errors = validate({ ...base, type: "signup", name: "" });
    assert.equal(errors.name, "名前を入力してください");
  });

  it("signupで名前ありはOK", () => {
    const errors = validate({ ...base, type: "signup", name: "テスト" });
    assert.equal(errors.name, undefined);
  });

  it("signinでは名前チェックなし", () => {
    const errors = validate({ ...base, type: "signin", name: "" });
    assert.equal(errors.name, undefined);
  });
});
