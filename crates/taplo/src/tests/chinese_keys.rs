use crate::{formatter, parser::parse};
use serde_json::json;

#[test]
fn generated_chinese_keys_preserve_the_entire_key() {
    for key in [
        "名称",
        "中文 空格",
        "中文.键",
        "中文🙂",
        "中文'键",
        "中文\n键",
        "",
    ] {
        let rendered = crate::dom::node::Key::new(key).to_string();
        let parsed = parse(&format!("{rendered} = 1"));
        assert!(parsed.errors.is_empty(), "{rendered}: {:?}", parsed.errors);
        assert_eq!(
            serde_json::to_value(parsed.into_dom()).unwrap(),
            json!({ key: 1 })
        );
    }
    assert_eq!(crate::dom::node::Key::new("名称").to_string(), "名称");
}

#[test]
fn chinese_keys_in_all_positions() {
    let src = r#"
名称 = "示例"
繁體鍵 = true
𠮷 = 2
abc中文_123-key = 3
123中文 = 4
true中文 = 5
配置.颜色 = "蓝色"
内联 = { 名称 = "内联", 子表.端口 = 8080 }
[服务器.数据库]
地址 = "localhost"
[[用户]]
姓名 = "小明"
[[用户]]
姓名 = "小红"
"#;
    let parsed = parse(src);
    assert!(parsed.errors.is_empty(), "{:?}", parsed.errors);
    let dom = parsed.into_dom();
    assert!(dom.validate().is_ok());
    assert_eq!(
        serde_json::to_value(&dom).unwrap(),
        json!({
            "名称": "示例", "繁體鍵": true, "𠮷": 2, "abc中文_123-key": 3,
            "123中文": 4, "true中文": 5,
            "配置": { "颜色": "蓝色" },
            "内联": { "名称": "内联", "子表": { "端口": 8080 } },
            "服务器": { "数据库": { "地址": "localhost" } },
            "用户": [{ "姓名": "小明" }, { "姓名": "小红" }]
        })
    );
}

#[test]
fn chinese_keys_survive_formatting() {
    let src = "名称=\"示例\"\n[服务器]\n端口=8080\n内联={中文=true}\n";
    let formatted = formatter::format(src, formatter::Options::default());
    assert!(formatted.contains("名称 = \"示例\""));
    assert!(formatted.contains("[服务器]"));
    assert!(formatted.contains("中文 = true"));
    assert_eq!(
        formatted,
        formatter::format(&formatted, formatter::Options::default())
    );
    assert_eq!(
        serde_json::to_value(parse(src).into_dom()).unwrap(),
        serde_json::to_value(parse(&formatted).into_dom()).unwrap()
    );
}

#[test]
fn chinese_globs_and_quoted_keys_are_equivalent() {
    let root = parse("服务甲 = 1\n服务乙 = 2\n其他 = 3\n").into_dom();
    assert_eq!(root.get_matches("服务*").unwrap().count(), 2);
    let parsed = parse("名称 = 1\n\"名称\" = 2\n");
    assert!(parsed.errors.is_empty());
    assert!(
        parsed.into_dom().validate().is_err(),
        "duplicate keys must still be rejected"
    );
}

#[test]
fn bare_values_and_key_punctuation_remain_invalid() {
    for src in [
        "名称 = 中文",
        "中文，键 = 1",
        "中文 键 = 1",
        "中文🙂 = 1",
        "中文* = 1",
    ] {
        let parsed = parse(src);
        assert!(
            !parsed.errors.is_empty() || parsed.into_dom().validate().is_err(),
            "{src}"
        );
    }
}
