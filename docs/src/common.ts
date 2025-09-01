import {
  getLocalizedUrl,
  getMarkdownMetadata,
  Locales,
  LocalesValues,
} from "intlayer";
import { join } from "path";
import {
  generateEmbedding,
  searchChunkReference,
  VectorStoreEl,
} from "./embeddings";

export const defaultLocale = Locales.ENGLISH;

export const GITHUB_URL_PREFIX =
  "https://github.com/aymericzip/smart_doc_RAG/blob/main/docs/";

export const getFile = async <
  F extends Record<string, Record<LocalesValues, Promise<string>>>,
>(
  files: F,
  docKey: keyof F,
  locale: LocalesValues = defaultLocale as LocalesValues
): Promise<string> => {
  const fileRecord = files[docKey];

  if (!fileRecord) {
    throw new Error(`File ${docKey as string} not found`);
  }

  const file = await files[docKey]?.[locale];

  if (!file) {
    const englishFile = await files[docKey][defaultLocale as LocalesValues];

    if (!englishFile) {
      throw new Error(`File ${docKey as string} not found`);
    }

    return englishFile;
  }

  return file;
};

export type FileMetadata = {
  docKey: string;
  relativeUrl: string;
  githubUrl: string;
  slugs: string[];
};

export const getFiles = async <
  F extends Record<`./${string}`, Record<LocalesValues, Promise<string>>>,
>(
  files: F,
  lang: LocalesValues = defaultLocale as LocalesValues
): Promise<Record<string, string>> => {
  const filesEntries = await Promise.all(
    Object.entries(files)
      .map(([key, value]) => [key, value[lang as LocalesValues]])
      .map(async ([key, value]) => [key, await value])
  );
  const filesResult = Object.fromEntries(filesEntries);
  return filesResult;
};

export const formatMetadata = (
  docKey: string,
  file: string,
  locale: LocalesValues = defaultLocale as LocalesValues
): FileMetadata => {
  const metadata = getMarkdownMetadata(file);

  const slugs = docKey.replace("./docs/en/", "").replace(".mdx", "").split("/");

  const relativeUrl = join(...(slugs ?? []));
  const slicedDocKey = docKey.replace("./", "");

  return {
    ...metadata,
    docKey,
    githubUrl: `${GITHUB_URL_PREFIX}${slicedDocKey}`.replace(
      "/en/",
      `/${locale}/`
    ),
    slugs,
    relativeUrl: getLocalizedUrl(relativeUrl, locale),
  } as FileMetadata;
};

export const getFileMetadata = async <
  F extends Record<string, Record<LocalesValues, Promise<string>>>,
  R extends FileMetadata,
>(
  files: F,
  docKey: keyof F,
  locale: LocalesValues = defaultLocale as LocalesValues
): Promise<R> => {
  try {
    const file = await getFile(files, docKey, locale);

    const metadata = formatMetadata(docKey as string, file, locale);

    return metadata as R;
  } catch (error) {
    throw error;
  }
};

export const getFileMetadataRecord = async <
  F extends Record<string, Record<LocalesValues, Promise<string>>>,
>(
  files: F,
  locale: LocalesValues = defaultLocale as LocalesValues
): Promise<Record<keyof F, FileMetadata>> => {
  const filesEntries = await Promise.all(
    Object.entries(files).map(async ([key]) => [
      key,
      await getFileMetadata(files, key as keyof F, locale),
    ])
  );
  const filesResult = Object.fromEntries(filesEntries);
  return filesResult;
};

export const getFileMetadataBySlug = async <
  F extends Record<string, Record<LocalesValues, Promise<string>>>,
>(
  files: F,
  slugs: string | string[],
  locale: LocalesValues = defaultLocale as LocalesValues,
  strict = false
) => {
  const slugsArray = Array.isArray(slugs) ? slugs : [slugs];
  const filesMetadata = await getFileMetadataRecord(
    files,
    defaultLocale as LocalesValues
  );

  let fileMetadataArray: FileMetadata[] = Object.values(filesMetadata).filter(
    (fileMetadata) =>
      slugsArray.every((slug) => fileMetadata.slugs?.includes(slug))
  );

  if (strict) {
    fileMetadataArray = fileMetadataArray.filter(
      (fileMetadata) => fileMetadata.slugs.length === slugsArray.length
    );
  }

  if (locale !== defaultLocale) {
    const localizedFileMetadata = await Promise.all(
      fileMetadataArray.map(
        async (fileMetadata) =>
          await getFileMetadata(files, fileMetadata.docKey, locale)
      )
    );

    return localizedFileMetadata;
  }

  return fileMetadataArray;
};

export const getFileBySlug = async <
  F extends Record<string, Record<LocalesValues, Promise<string>>>,
>(
  files: F,
  slugs: string | string[],
  locale: LocalesValues = defaultLocale as LocalesValues,
  strict = false
) => {
  const slugsArray = Array.isArray(slugs) ? slugs : [slugs];
  const filesMetadata = await getFileMetadataRecord(
    files,
    defaultLocale as LocalesValues
  );

  let fileMetadataArray = Object.values(filesMetadata).filter((fileMetadata) =>
    slugsArray.every((slug) => fileMetadata.slugs?.includes(slug))
  );

  if (strict) {
    fileMetadataArray = fileMetadataArray.filter(
      (fileMetadata) => fileMetadata.slugs.length === slugsArray.length
    );
  }

  const fileList = await Promise.all(
    fileMetadataArray.map(async (fileMetadata) => {
      const file = await getFile(files, fileMetadata.docKey, locale);
      return file;
    })
  );

  return fileList;
};

export const searchFile = async (
  query: string,
  vectorStore: VectorStoreEl[]
): Promise<VectorStoreEl[]> => {
  const queryEmbedding = await generateEmbedding(query);
  const filesMetadata = searchChunkReference(queryEmbedding, vectorStore);

  return filesMetadata;
};
