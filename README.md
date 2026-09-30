# TOML 中文键名

基于 [Taplo / Even Better TOML](https://github.com/tamasfe/taplo) 的个人维护分支，为 VS Code 增加不加引号的中文键名支持。继续使用 MIT 协议，保留原作者版权声明。

上游基线：`08f343be02ce1b20296470396a42f0fa47820449`；上游插件版本 0.21.2；本分支插件版本 1.0.0（正式版）。

## 支持范围

```toml
名称 = "示例"
繁體鍵 = true
𠮷 = 2
配置.颜色 = "蓝色"
连接 = { 地址 = "localhost", 端口 = 8080 }

[服务器.数据库]
地址 = "127.0.0.1"

[[用户]]
姓名 = "小明"
```

普通键、点分键、表名、表数组和内联表支持 Unicode Han 汉字，可与原有英文字母、数字、下划线、连字符混用。中文通配符匹配同样可用。中文字符串值仍需引号；包含空格、中文标点或 emoji 的键仍需引号。

这是对 TOML 标准的扩展。插件支持不代表其他 TOML 解析库也支持；例如 Cargo、Python tomllib 等程序读取文件时仍可能拒绝中文裸键名。需要跨工具兼容时请使用 `"名称" = "示例"`。

## 安装

1. 构建后的插件在 `artifacts/chinese-bare-key-toml-1.0.0.vsix`。
2. 在 VS Code 扩展页面的“…”菜单选择“从 VSIX 安装”。
3. 禁用原版 Even Better TOML 及其他会同时处理 TOML 的扩展，避免重复诊断、命令和格式化器冲突。
4. 保持 `evenBetterToml.taplo.bundled` 为 `true`（默认值），使用本插件内置的修改版语言服务。
5. 打开 `examples/chinese-keys.toml` 验证高亮、错误提示与格式化。

扩展 ID 为 `local-toml.chinese-bare-key-toml`。`local-toml` 是本地安装使用的占位发布者；本项目尚未发布到 Marketplace。为兼容现有用户配置，设置和命令继续使用 `evenBetterToml` 前缀。

## 从源码构建

已在 Windows x64、Rust 1.88.0、Node.js 24 环境验证。Windows 还需 Visual Studio C++ 构建工具和 Windows SDK。

准备一次：

```powershell
rustup target add wasm32-unknown-unknown
```

在项目根目录运行：

```powershell
node scripts/build-extension.mjs
```

脚本使用仓库自带 Yarn 4.0.2，不需要全局安装 Yarn、TypeScript 或 vsce。首次构建需要网络下载依赖及与 Cargo.lock 匹配的 wasm-bindgen。它会依次运行 Rust 测试、构建本地 WebAssembly 语言服务、构建扩展、测试实际高亮和语言服务、生成 VSIX。任何失败都会中止打包。

如果自动下载 wasm-bindgen 失败，可自行准备对应版本，并设置 `WASM_BINDGEN_BIN` 指向它。当前 Cargo.lock 对应 0.2.100。也可以从源码安装到项目本地目录：

```powershell
cargo install wasm-bindgen-cli --version 0.2.100 --locked --root .build-tools
$env:WASM_BINDGEN_BIN = (Resolve-Path .build-tools/bin/wasm-bindgen.exe).Path
node scripts/build-extension.mjs
```

## 修改位置

- `crates/taplo/src/syntax.rs`：中文裸键与中文通配符的词法规则。
- `crates/taplo/src/tests/chinese_keys.rs`：解析、格式化、重复键及非法字符回归测试。
- `crates/taplo/src/dom/node/nodes.rs`：转换 JSON 时完整检查键名，避免含空格或点的中文键被误输出为裸键。
- `crates/taplo-wasm/src/lsp.rs`：确保语言服务以普通 JSON 对象传递结果，修复 Map 经 IPC 序列化后丢失数据的问题。
- `editors/vscode/src/syntax/composite/`：VS Code 高亮规则，源文件生成 `toml.tmLanguage.json`。
- `editors/vscode/tests/`：使用 TextMate/Oniguruma 和实际打包语言服务的测试。
- `editors/vscode/package.json`：分支扩展名称、版本、发布者；使用本地 `js/lsp`，避免打包未修改的上游语言服务。
- `scripts/build-extension.mjs`：完整构建与打包入口。

## 上传到自己的 GitHub

在 GitHub Desktop 中将此文件夹创建为新的本地仓库，再发布到自己的 GitHub。上传源文件、锁文件、LICENSE 和仓库自带的 `js/.yarn/releases/yarn-4.0.2.cjs`。不要上传 `target`、`node_modules`、`.build-tools` 和构建缓存；`.gitignore` 已排除这些内容。VSIX 可单独附加到 GitHub Release，无需纳入源代码提交。

新仓库创建后，在 `editors/vscode/package.json` 添加自己的 `repository` 和 `bugs` 地址。若以后发布到 VS Code Marketplace，还需将 `publisher` 改为自己注册的发布者 ID。

`.github/workflows/fork-ci.yml` 用于 Windows 自动测试、构建并保存 VSIX 工件，不会自动发布到 Marketplace、npm、crates.io 或 GitHub Release。上游工作流已移到 `.github/upstream-workflows/` 供参考，避免继承上游发布流程和账号配置。

## 许可证与来源

本分支采用 MIT。根目录 `LICENSE` 和插件的 `LICENSE.md` 保留原作者 Ferenc Tamás 的版权及完整 MIT 文本；语法规则的来源说明也已保留。上游文档分别保存为根目录和插件目录中的 `README.upstream.md`。维护者尚未填写新的署名，不冒用上游发布者身份。
