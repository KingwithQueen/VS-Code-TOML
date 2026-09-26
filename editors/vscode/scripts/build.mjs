#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const cwd = fileURLToPath(new URL("../", import.meta.url));
const yarn = fileURLToPath(new URL("../../../js/.yarn/releases/yarn-4.0.2.cjs", import.meta.url));
for (const task of ["build:syntax", "build:node", "build:browser-extension", "build:browser-server"]) {
  const result = spawnSync(process.execPath, [yarn, "run", task], { cwd, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
