import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const js = path.join(root, "js");
const extension = path.join(root, "editors", "vscode");
const yarn = path.join(js, ".yarn", "releases", "yarn-4.0.2.cjs");
const localBindgen = path.join(root, ".build-tools", "bin", process.platform === "win32" ? "wasm-bindgen.exe" : "wasm-bindgen");
if (!process.env.WASM_BINDGEN_BIN && existsSync(localBindgen)) {
  process.env.WASM_BINDGEN_BIN = localBindgen;
}
function run(command, args, cwd = root, env = process.env) {
  const result = spawnSync(command, args, { cwd, env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
function runYarn(cwd, args, env) { run(process.execPath, [yarn, ...args], cwd, env); }

run("cargo", ["fetch", "--locked"]);
run("cargo", ["test", "--locked", "-p", "taplo", "--lib"]);
runYarn(js, ["install", "--immutable"]);
runYarn(js, ["workspace", "@taplo/core", "build"]);
runYarn(js, ["workspace", "@taplo/lsp", "build"], { ...process.env, RELEASE: "true" });
runYarn(extension, ["install", "--immutable"]);
runYarn(extension, ["build"]);
run(process.execPath, ["tests/chinese-keys.mjs"], extension);
run(process.execPath, ["tests/lsp.mjs"], extension);
const pkg = JSON.parse(readFileSync(path.join(extension, "package.json"), "utf8"));
mkdirSync(path.join(root, "artifacts"), { recursive: true });
runYarn(extension, ["exec", "vsce", "package", "--no-dependencies", "--no-yarn",
  "--allow-missing-repository", "--out", path.join(root, "artifacts", `${pkg.name}-${pkg.version}.vsix`)]);
