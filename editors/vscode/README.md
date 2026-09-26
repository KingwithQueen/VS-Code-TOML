# TOML 中文键名

基于 [Taplo / Even Better TOML](https://github.com/tamasfe/taplo) 的独立维护分支，提供中文裸键名的语法高亮、诊断和格式化。MIT 协议，保留原作者版权声明。

```toml
名称 = "示例"
配置.颜色 = "蓝色"
连接 = { 地址 = "localhost", 端口 = 8080 }

[服务器.数据库]
地址 = "127.0.0.1"

[[用户]]
姓名 = "小明"
```

支持简体、繁体和 Unicode Han 生僻汉字，可与英文、数字、下划线及连字符混用。字符串值，以及含空格、标点或 emoji 的键，仍需引号。

中文裸键名属于本分支的语法扩展，其他程序的标准 TOML 解析器可能不接受。需要通用兼容时请使用带引号的中文键。

安装本插件后请禁用原版 Even Better TOML，避免重复诊断和命令冲突。保持 `evenBetterToml.taplo.bundled` 为 `true`，以启用内置修改版语言服务。原有 `evenBetterToml` 设置保持兼容。

本地扩展 ID：`local-toml.chinese-bare-key-toml`，其中 `local-toml` 是待替换的本地发布者占位名称，并非上游作者账号。本插件尚未发布至 Marketplace。

从源码构建请在仓库根目录运行 `node scripts/build-extension.mjs`。详细维护和上传说明见仓库根目录 README。
