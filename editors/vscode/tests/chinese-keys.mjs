import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import tm from "vscode-textmate";
import onig from "vscode-oniguruma";

const require = createRequire(import.meta.url);
const wasm = await readFile(require.resolve("vscode-oniguruma/release/onig.wasm"));
await onig.loadWASM(wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength));
const registry = new tm.Registry({
  onigLib: Promise.resolve({
    createOnigScanner: patterns => new onig.OnigScanner(patterns),
    createOnigString: text => new onig.OnigString(text),
  }),
  loadGrammar: async () => tm.parseRawGrammar(
    await readFile(new URL("../toml.tmLanguage.json", import.meta.url), "utf8"),
    "toml.tmLanguage.json"
  ),
});
const grammar = await registry.loadGrammar("source.toml");
function assertKey(line, key, expectedScope) {
  const start = line.indexOf(key);
  assert.notEqual(start, -1);
  const tokens = grammar.tokenizeLine(line).tokens;
  for (let pos = start; pos < start + key.length; pos++) {
    const token = tokens.find(t => t.startIndex <= pos && t.endIndex > pos);
    assert(token?.scopes.includes(expectedScope), `${line}: ${key} at ${pos}: ${JSON.stringify(token)}`);
  }
}
const entry = "support.type.property-name.toml";
for (const key of ["名称", "繁體鍵", "𠮷", "abc中文_123-key", "123中文", "true中文", "普通_key-123"]) {
  assertKey(`${key} = 1`, key, entry);
}
assertKey("配置.颜色 = 1", "配置", entry);
assertKey("配置.颜色 = 1", "颜色", entry);
assertKey("内联 = {中文 = 1,子表.端口 = 2}", "中文", entry);
assertKey("内联 = {中文 = 1,子表.端口 = 2}", "端口", entry);
assertKey("[服务器.数据库]", "服务器", "support.type.property-name.table.toml");
assertKey("[服务器.数据库]", "数据库", "support.type.property-name.table.toml");
assertKey("[[用户]]", "用户", "support.type.property-name.array.toml");
assertKey('"中文 键" = 1', '"中文 键"', entry);
assertKey('"" = 1', '""', entry);
assertKey('"含\\"引号" = 1', '"含\\"引号"', entry);
for (const line of ["中文，键 = 1", "中文🙂 = 1", "中文+键 = 1", "[中文 键]"]) {
  const tokens = grammar.tokenizeLine(line).tokens;
  assert(!tokens.some(t => t.scopes.some(s => s.startsWith("support.type.property-name"))), line);
}
console.log("Chinese keys: TextMate / Oniguruma highlighting tests passed.");
registry.dispose();
