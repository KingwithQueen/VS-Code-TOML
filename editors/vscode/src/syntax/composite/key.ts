// Keep the bare-key character class in sync with crates/taplo/src/syntax.rs.
// These strings are Oniguruma patterns, not JavaScript regular expressions.
export const keySegment = String.raw`(?:[A-Za-z0-9_\p{Han}-]+|"(?:[^"\\\r\n]|\\.)*"|'[^'\r\n]*')`;
export const dottedKey = `${keySegment}(?:[ \\t]*\\.[ \\t]*${keySegment})*`;
