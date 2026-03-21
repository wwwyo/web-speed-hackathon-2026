import { copyFileSync } from "node:fs";

import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  outDir: "dist",
  target: "node24",
  platform: "node",
  splitting: false,
  clean: true,
  noExternal: [/@web-speed-hackathon-2026/],
  onSuccess: async () => {
    copyFileSync("src/routes/api/crok-response.md", "dist/crok-response.md");
  },
});
