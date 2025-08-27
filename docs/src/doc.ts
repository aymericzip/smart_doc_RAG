import { LocalesValues } from "intlayer";
import {
  FileMetadata,
  defaultLocale,
  getFile,
  searchFile,
  getFileBySlug,
  getFileMetadata,
  getFileMetadataBySlug,
  getFileMetadataRecord,
  getFiles,
} from "./common";
import { docsEntry } from "./generated/entry";
import embeddingsList from "./generated/embeddings.json" with { type: "json" };
import { chunkText, VectorStoreEl } from "./embeddings";

export type DocKey = keyof typeof docsEntry;
export type Docs = Record<DocKey, Record<LocalesValues, Promise<string>>>;
export type DocMetadata = FileMetadata;

export const getDocs = async <L extends LocalesValues>(
  locale: L = defaultLocale as L
): Promise<Record<DocKey, string>> => await getFiles(docsEntry, locale);

export const getDoc = async <L extends LocalesValues>(
  docName: keyof typeof docsEntry,
  locale: L = defaultLocale as L
): Promise<string> => await getFile(docsEntry, docName, locale);

export const getDocMetadataRecord = async <L extends LocalesValues>(
  locale: L = defaultLocale as L
): Promise<Record<DocKey, FileMetadata>> =>
  await getFileMetadataRecord(docsEntry, locale);

export const getDocMetadata = async <D extends DocKey, L extends LocalesValues>(
  docName: D,
  locale: L = defaultLocale as L
): Promise<FileMetadata> => await getFileMetadata(docsEntry, docName, locale);

export const getDocMetadataBySlug = async <L extends LocalesValues>(
  slugs: string | string[],
  locale: L = defaultLocale as L,
  strict = false
): Promise<FileMetadata[]> =>
  await getFileMetadataBySlug(docsEntry, slugs, locale, strict);

export const getDocBySlug = async <L extends LocalesValues>(
  slugs: string | string[],
  locale: L = defaultLocale as L,
  strict = false
): Promise<string[]> => await getFileBySlug(docsEntry, slugs, locale, strict);

/**
 * Indexes all Markdown documents by generating embeddings for each chunk and storing them in memory.
 * Also updates the embeddings.json file if new embeddings are generated.
 * Handles cases where files have been updated and chunk counts have changed.
 */
export const loadChunksWithEmbedding = async (): Promise<VectorStoreEl[]> => {
  const vectorStore: VectorStoreEl[] = [];

  // Retrieve documentation posts in English locale
  const docs = await getDocs();

  let result: Record<string, number[]> = {}; // Object to hold updated embeddings
  const currentChunkKeys = new Set<string>(); // Track which chunks should exist

  // Iterate over each file key (identifier) in the combined files
  for await (const fileKey of Object.keys(docs)) {
    // Split the document into chunks based on headings
    const fileChunks = chunkText(docs[fileKey as keyof typeof docs] as string);

    // Iterate over each chunk within the current file
    for await (const chunkIndex of Object.keys(fileChunks)) {
      const chunkNumber = Number(chunkIndex) + 1; // Chunk number starts at 1

      const fileChunk = fileChunks[
        chunkIndex as keyof typeof fileChunks
      ] as string;

      const embeddingKeyName = `${fileKey}/chunk_${chunkNumber}`; // Unique key for the chunk
      currentChunkKeys.add(embeddingKeyName); // Track this chunk as current

      // Retrieve precomputed embedding if available and file hasn't changed
      const embedding = embeddingsList[
        embeddingKeyName as keyof typeof embeddingsList
      ] as number[] | undefined;

      // Store the embedding and content in the in-memory vector store
      vectorStore.push({
        fileKey,
        chunkNumber,
        embedding,
        content: fileChunk,
      });
    }
  }

  // Remove outdated embeddings that no longer exist in current files
  const filteredEmbeddings: Record<string, number[]> = {};
  for (const [key, embedding] of Object.entries(embeddingsList)) {
    if (currentChunkKeys.has(key)) {
      // Only keep embeddings for chunks that still exist
      if (!result[key]) {
        filteredEmbeddings[key] = embedding as number[];
      }
    }
  }

  return vectorStore;
};

export const searchDoc = async (query: string): Promise<VectorStoreEl[]> => {
  const vectorStore = await loadChunksWithEmbedding();

  return await searchFile(query, vectorStore);
};
