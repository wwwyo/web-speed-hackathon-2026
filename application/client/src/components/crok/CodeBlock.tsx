import { ComponentProps, CSSProperties, isValidElement, ReactElement, ReactNode } from "react";
import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/prism-light";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import diff from "react-syntax-highlighter/dist/esm/languages/prism/diff";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import markdown from "react-syntax-highlighter/dist/esm/languages/prism/markdown";
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import rust from "react-syntax-highlighter/dist/esm/languages/prism/rust";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

const codeBlockStyle: CSSProperties = {
  fontSize: "14px",
  padding: "24px 16px",
  borderRadius: "8px",
  border: "1px solid var(--color-cax-border)",
};

SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("diff", diff);
SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("jsx", jsx);
SyntaxHighlighter.registerLanguage("markdown", markdown);
SyntaxHighlighter.registerLanguage("markup", markup);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("rust", rust);
SyntaxHighlighter.registerLanguage("sql", sql);
SyntaxHighlighter.registerLanguage("tsx", tsx);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.alias("bash", ["shell", "sh", "zsh"]);
SyntaxHighlighter.alias("javascript", ["js"]);
SyntaxHighlighter.alias("jsx", ["javascriptreact"]);
SyntaxHighlighter.alias("markdown", ["md"]);
SyntaxHighlighter.alias("markup", ["html", "svg", "xml"]);
SyntaxHighlighter.alias("python", ["py"]);
SyntaxHighlighter.alias("rust", ["rs"]);
SyntaxHighlighter.alias("tsx", ["typescriptreact"]);
SyntaxHighlighter.alias("typescript", ["ts"]);

const supportedLanguages = new Set([
  "bash",
  "css",
  "diff",
  "javascript",
  "json",
  "jsx",
  "markdown",
  "markup",
  "python",
  "rust",
  "sql",
  "tsx",
  "typescript",
  "shell",
  "sh",
  "zsh",
  "js",
  "javascriptreact",
  "md",
  "html",
  "svg",
  "xml",
  "py",
  "rs",
  "typescriptreact",
  "ts",
]);

const getLanguage = (children: ReactElement<ComponentProps<"code">>) => {
  const className = children.props.className;
  if (typeof className === "string") {
    const match = className.match(/language-([\w-]+)/);
    return match?.[1]?.toLowerCase() ?? "javascript";
  }
  return "javascript";
};

const isCodeElement = (children: ReactNode): children is ReactElement<ComponentProps<"code">> =>
  isValidElement(children) && children.type === "code";

export const CodeBlock = ({ children }: ComponentProps<"pre">) => {
  if (!isCodeElement(children)) return <>{children}</>;
  const language = getLanguage(children);
  const code = children.props.children?.toString() ?? "";
  if (!supportedLanguages.has(language)) {
    return (
      <pre style={codeBlockStyle}>
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <SyntaxHighlighter
      customStyle={codeBlockStyle}
      language={language}
      style={oneLight}
    >
      {code}
    </SyntaxHighlighter>
  );
};
