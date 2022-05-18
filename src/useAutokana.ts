import { useState, useCallback } from "react";

export type FuriganaMap = Record<string, string>;

export const isEmptyObject = (obj: FuriganaMap) => !Object.keys(obj).length;
export const isKatakana = (str: string) =>
  /[\u{3000}-\u{301C}\u{30A1}-\u{30F6}\u{30FB}-\u{30FE}]/mu.test(str);
export const isKanji = (str: string) =>
  /([\u{3005}\u{3007}\u{303b}\u{3400}-\u{9FFF}\u{F900}-\u{FAFF}\u{20000}-\u{2FFFF}][\u{E0100}-\u{E01EF}\u{FE00}-\u{FE02}]?)/mu.test(
    str
  );
export const hiraganaToKatakana = (str: string) =>
  str.replace(/[\u3041-\u3096]/g, (match) =>
    String.fromCharCode(match.charCodeAt(0) + 0x60)
  );
export const extractKatakana = (str: string) =>
  Array.from(str).filter(isKatakana).join("");
export const hasUnregisteredKanji = (str: string, furiganaMap: FuriganaMap) =>
  isKanji(
    Object.keys(furiganaMap).reduce((pre, kanji) => pre.replace(kanji, ""), str)
  );
export const getFuriganaKeyFromPartialKey = (
  str: string,
  furiganaMap: FuriganaMap
) =>
  Object.keys(furiganaMap).reduce(
    (pre, kanji) => (kanji.includes(str) ? kanji : pre),
    ""
  );
export const splitKanjiAndKatakanaBlock = (
  str: string,
  furiganaMap: FuriganaMap
) =>
  // eslint-disable-next-line max-statements
  Array.from(str).reduce((pre: string[], cur) => {
    const preLength = pre.length;
    const preValue = pre[preLength - 1];
    const preFuriganaKey = getFuriganaKeyFromPartialKey(preValue, furiganaMap);
    const curFuriganaKey = getFuriganaKeyFromPartialKey(cur, furiganaMap);

    if (curFuriganaKey) {
      if (preFuriganaKey === curFuriganaKey) {
        return [...pre.slice(0, preLength - 1), preValue + cur];
      }
      return [...pre, cur];
    }
    if (
      (isKanji(preValue) &&
        isKanji(cur) &&
        !furiganaMap[preValue] &&
        !furiganaMap[cur]) ||
      (isKatakana(preValue) && isKatakana(cur))
    ) {
      return [
        ...pre.slice(0, preLength - 1),
        preValue + cur,
        ...pre.slice(preLength),
      ];
    }
    return [...pre, cur];
  }, []);
export const splitKatakanaBlock = (
  kanjiAndKatakanaBlock: string[],
  output: string,
  furiganaMap: FuriganaMap
) =>
  kanjiAndKatakanaBlock.reduce((pre: string[], cur, i) => {
    // already registered furiganaMap
    if (furiganaMap[cur]) {
      return [...pre, furiganaMap[cur]];
    }
    // katakana before kanji
    if (output.replace(pre.join(""), "").startsWith(cur)) {
      return [...pre, cur];
    }
    // kanji before katakana
    if ((pre[i - 1] || "").includes(cur)) {
      return [...pre.slice(0, i - 1), pre[i - 1].split(cur)[0], cur];
    }
    // kanji before kanji
    if (furiganaMap[kanjiAndKatakanaBlock[i + 1]]) {
      return [
        ...pre,
        ...[
          output
            .replace(pre.join(""), "")
            .split(furiganaMap[kanjiAndKatakanaBlock[i + 1]])[0],
        ],
      ];
    }
    // other case
    return [...pre, output.replace(pre.join(""), "")];
  }, []);
export const updateFuriganaMap = (
  input: string,
  output: string,
  furiganaMap: FuriganaMap
) => {
  if (!input) {
    return {};
  }

  const kanjiAndKatakanaBlock = splitKanjiAndKatakanaBlock(input, furiganaMap);
  const katakanaBlock = splitKatakanaBlock(
    kanjiAndKatakanaBlock,
    output,
    furiganaMap
  );

  return kanjiAndKatakanaBlock.reduce(
    (pre, cur, i) => ({
      ...pre,
      ...(isKanji(cur) ? { [cur]: katakanaBlock[i] } : null),
    }),
    {}
  );
};
export const convertInputValue = (str: string, furiganaMap: FuriganaMap) =>
  Object.entries(furiganaMap).reduce(
    (pre, [kanji, katakana]) => pre.replace(new RegExp(kanji, "g"), katakana),
    str
  );
export const useAutoKana = (
  getOutput: () => string,
  setOutputValue: (furiganaMap: string) => void
) => {
  const [furiganaMap, setFuriganaMap] = useState({});
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      const output = getOutput();
      const katakanaAndKanji = hiraganaToKatakana(input);
      const notRegisteredKanji = hasUnregisteredKanji(
        katakanaAndKanji,
        furiganaMap
      );
      const newFuriganaMap = (() => {
        if (notRegisteredKanji) {
          return updateFuriganaMap(katakanaAndKanji, output, furiganaMap);
        }
        if (input) {
          return furiganaMap;
        }
        return {};
      })();
      const katakana = extractKatakana(
        convertInputValue(katakanaAndKanji, newFuriganaMap)
      );

      setFuriganaMap(newFuriganaMap);
      setOutputValue(katakana);
    },
    [furiganaMap, getOutput, setOutputValue]
  );

  return { onChange };
};
