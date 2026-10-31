/**
 * Indian numbering system and Telugu date formatters.
 */
import { Strings, enStrings, teStrings } from "./strings";

export type SupportedLanguage = "en" | "te";

const TELUGU_MONTHS = [
  "జనవరి", "ఫిబ్రవరి", "మార్చి", "ఏప్రిల్", "మే", "జూన్",
  "జూలై", "ఆగస్టు", "సెప్టెంబర్", "అక్టోబర్", "నవంబర్", "డిసెంబర్"
];

const EN_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const ASCII_TO_TELUGU_DIGITS: Record<string, string> = {
  '0': '౦', '1': '౧', '2': '౨', '3': '౩', '4': '౪',
  '5': '౫', '6': '౬', '7': '౭', '8': '౮', '9': '౯'
};

export function t(key: keyof Strings, lang: SupportedLanguage = "en"): string {
  const dict = lang === "te" ? teStrings : enStrings;
  return dict[key] || enStrings[key] || String(key);
}

export function formatIndianNumber(num: number, useTeluguDigits: boolean = false): string {
  if (isNaN(num)) return "0";
  const str = Math.floor(Math.abs(num)).toString();
  let result = "";

  if (str.length <= 3) {
    result = str;
  } else {
    const lastThree = str.substring(str.length - 3);
    const otherNumbers = str.substring(0, str.length - 3);
    const withCommas = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
    result = withCommas;
  }

  if (useTeluguDigits) {
    return result.split("").map(c => ASCII_TO_TELUGU_DIGITS[c] || c).join("");
  }
  return result;
}

export function formatDate(dateStr: string, lang: SupportedLanguage = "en"): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const day = date.getDate();
    const monthIdx = date.getMonth();
    const year = date.getFullYear();

    if (lang === "te") {
      return `${day} ${TELUGU_MONTHS[monthIdx]} ${year}`;
    }
    return `${day} ${EN_MONTHS[monthIdx]} ${year}`;
  } catch {
    return dateStr;
  }
}
