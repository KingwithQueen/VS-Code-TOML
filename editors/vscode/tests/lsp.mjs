import assert from "node:assert/strict";
import { fork } from "node:child_process";
import { fileURLToPath } from "node:url";

// Exercise the actual bundled server over VS Code's desktop IPC transport.
const serverPath = process.argv[2] ?? fileURLToPath(new URL("../dist/server.js", import.meta.url));
const child = fork(serverPath, [], {
  cwd: fileURLToPath(new URL("../../../examples/", import.meta.url)),
  stdio: ["ignore", "pipe", "pipe", "ipc"],
});
let output = "";
child.stdout.on("data", d => { output += d; });
child.stderr.on("data", d => { output += d; });
const pending = new Map();
const waiters = [];
let nextId = 1;
let configurationSent;
const configured = new Promise(resolve => { configurationSent = resolve; });
child.on("message", message => {
  if (process.env.VERBOSE) console.log(JSON.stringify(message));
  if (message.method === "workspace/configuration") {
    child.send({ jsonrpc: "2.0", id: message.id, result: message.params.items.map(() => ({ schema: { enabled: false, catalogs: [] } })) });
    configurationSent();
  } else if (message.id != null && !message.method) {
    const resolve = pending.get(message.id);
    pending.delete(message.id);
    resolve?.(message);
  }
  for (const waiter of [...waiters]) {
    if (waiter.matches(message)) {
      waiters.splice(waiters.indexOf(waiter), 1);
      waiter.resolve(message);
    }
  }
});
const timeout = setTimeout(() => {
  console.error("LSP test timed out.\n" + output);
  child.kill();
  process.exit(1);
}, 45000);
function notify(method, params) { child.send({ jsonrpc: "2.0", method, params }); }
async function request(method, params) {
  const id = nextId++;
  const response = new Promise(resolve => pending.set(id, resolve));
  child.send({ jsonrpc: "2.0", id, method, params });
  const message = await response;
  if (process.env.VERBOSE) console.log(`Completed ${method}`);
  assert(!message.error, JSON.stringify(message.error));
  return message.result;
}
function diagnostics(uri, predicate = () => true) {
  return new Promise(resolve => waiters.push({
    matches: m => m.method === "textDocument/publishDiagnostics" && m.params.uri === uri && predicate(m.params.diagnostics),
    resolve: m => resolve(m.params.diagnostics),
  }));
}
try {
  const initialized = await request("initialize", { processId: process.pid, rootUri: null, capabilities: {} });
  assert.equal(initialized.capabilities.documentFormattingProvider, true);
  notify("initialized", {});
  await configured;
  const uri = "file:///chinese-bare-key-test.toml";
  // This query waits for the workspace configuration write lock to be released.
  await request("taplo/listSchemas", { documentUri: uri });
  const valid = diagnostics(uri);
  notify("textDocument/didOpen", { textDocument: {
    uri, languageId: "toml", version: 1,
    text: '名称="示例"\n𠮷=2\n配置.颜色="蓝色"\n内联={端口=8080}\n[服务器]\n地址="localhost"\n[[用户]]\n姓名="小明"\n',
  } });
  assert.deepEqual(await valid, [], "Chinese keys must not produce diagnostics");
  const edits = await request("textDocument/formatting", { textDocument: { uri }, options: { tabSize: 2, insertSpaces: true } });
  assert(edits?.some(edit => edit.newText.includes('名称 = "示例"') && edit.newText.includes("𠮷 = 2")), JSON.stringify(edits));
  const symbols = await request("textDocument/documentSymbol", { textDocument: { uri } });
  assert(JSON.stringify(symbols).includes("名称") && JSON.stringify(symbols).includes("服务器"));
  const converted = await request("taplo/convertToToml", { text: JSON.stringify({ "名称": 1, "中文 空格": 2, "中文.键": 3 }) });
  assert(!converted.error, converted.error);
  const roundTrip = await request("taplo/convertToJson", { text: converted.text });
  assert.deepEqual(JSON.parse(roundTrip.text), { "名称": 1, "中文 空格": 2, "中文.键": 3 });
  const invalid = diagnostics(uri, d => d.length > 0);
  notify("textDocument/didChange", { textDocument: { uri, version: 2 }, contentChanges: [{ text: "名称 = 中文\n" }] });
  assert((await invalid).length > 0, "Unquoted Chinese values must still produce diagnostics");
  const duplicate = diagnostics(uri, d => d.length > 0);
  notify("textDocument/didChange", { textDocument: { uri, version: 3 }, contentChanges: [{ text: '名称 = 1\n"名称" = 2\n' }] });
  assert((await duplicate).length > 0, "Quoted and bare Chinese keys must conflict");
  console.log("Bundled LSP: Chinese diagnostics, formatting, symbols and invalid-input tests passed.");
} finally {
  clearTimeout(timeout);
  child.kill();
}
