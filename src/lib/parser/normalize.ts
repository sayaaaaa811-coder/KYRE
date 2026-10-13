const CIRCLED_DIGITS = /[①-⑳❶-❿➀-➉➊-➓]/g;
const URL_OR_EMAIL = /(?:https?:\/\/|www\.)[^\s]+|[\w.+-]+@[\w-]+\.[\w.-]+/g;

/**
 * 解析前の正規化。
 * - 丸数字（①など）は箇条書きの記号として扱う（NFKC で「1」に変わり日付と誤認されるのを防ぐ）
 * - NFKC で全角英数字・記号を半角に（１０／２０ → 10/20、（火） → (火)、～ → ~）
 * - URL・メールアドレスは数字を誤抽出しないよう空白に置き換える
 * - 英字は小文字に（PM / pm を同一視）
 */
export function normalize(text: string): string {
  return text.replace(CIRCLED_DIGITS, "・").normalize("NFKC").replace(URL_OR_EMAIL, " ").toLowerCase();
}
