import { Locales, type IntlayerConfig } from "intlayer";

export const locales = [
  Locales.ARABIC,
  Locales.GERMAN,
  Locales.ENGLISH,
  Locales.SPANISH,
  Locales.FRENCH,
  Locales.HINDI,
  Locales.ITALIAN,
  Locales.JAPANESE,
  Locales.KOREAN,
  Locales.PORTUGUESE,
  Locales.RUSSIAN,
  Locales.CHINESE,
];
export const defaultLocale = Locales.ENGLISH;

const config: IntlayerConfig = {
  internationalization: {
    locales,
    defaultLocale,
    strictMode: "strict",
  },
  content: {
    dictionaryOutput: ["intlayer"],
    contentDir: ["./src"],
  },

  build: {
    importMode: "dynamic",
  },
  log: {
    mode: "verbose",
  },
};

export default config;
