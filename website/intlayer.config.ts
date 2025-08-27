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
  editor: {
    enabled: true,
    hotReload: false,
    dictionaryPriorityStrategy: "distant_first",
    applicationURL: "http://localhost:3000",
    editorURL: process.env.NEXT_PUBLIC_EDITOR_URL,
    cmsURL: process.env.NEXT_PUBLIC_CMS_URL,
    backendURL: process.env.NEXT_PUBLIC_BACKEND_URL,
    clientId: process.env.INTLAYER_CLIENT_ID,
    clientSecret: process.env.INTLAYER_CLIENT_SECRET,
  },
  build: {
    importMode: "dynamic",
  },
  log: {
    mode: "verbose",
  },
};

export default config;
