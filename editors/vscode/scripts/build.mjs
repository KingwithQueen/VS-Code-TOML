#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const cwd = fileURLToPath(new URL("../", import.meta.url));
const yarn = fileURLToPath(new URL("../../../js/.yarn/releases/yarn-4.0.2.cjs", import.meta.url));
// Fail early when a moved checkout has lost its local language-server link.
createRequire(new URL("../package.json", import.meta.url)).resolve("@taplo/lsp");
for (const task of ["build:syntax", "build:node", "build:browser-extension", "build:browser-server"]) {
  const result = spawnSync(process.execPath, [yarn, "run", task], { cwd, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
