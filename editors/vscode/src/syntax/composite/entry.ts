import { dottedKey, keySegment } from "./key";

export const entryBegin = {
  name: "meta.entry.toml",
  match: `(?<![^ \\t{,])(${dottedKey})[ \\t]*(=)`,
  captures: {
    1: {
      patterns: [
        {
          match: keySegment,
          name: "support.type.property-name.toml",
        },
        {
          match: "\\.",
          name: "punctuation.separator.dot.toml",
        },
      ],
    },
    2: {
      name: "punctuation.eq.toml",
    },
  },
};
