import dotenv from "dotenv";
import { readFile } from "fs/promises";
import { mkdirSync, writeFileSync } from "fs";
import { getMarkdownMetadata } from "intlayer";
import { OpenAI } from "openai";
import embeddingsList from "../src/generated/embeddings.json" with { type: "json" };
import fg from "fast-glob";
import { chunkText } from "../src";
import { join } from "path";

type VectorStoreEl = {
  fileKey: string;
  chunkNumber: number;
  content: string;
  embedding: number[];
  docUrl: string;
  docName: string;
};

/**
 * Simple in-memory vector store to hold document embeddings and their content.
 * Each entry contains:
 * - fileKey: A unique key identifying the file
 * - chunkNumber: The number of the chunk within the document
 * - content: The chunk content
 * - embedding: The numerical embedding vector for the chunk
 */
const vectorStore: VectorStoreEl[] = [];

/*
 * Embedding model configuration
 */
const EMBEDDING_MODEL: OpenAI.EmbeddingModel = "text-embedding-3-large"; // Model to use for embedding generation

/**
 * Generates an embedding for a given text using OpenAI's embedding API.
 * Trims the text if it exceeds the maximum allowed characters.
 *
 * @param text - The input text to generate an embedding for
 * @returns The embedding vector as a number array
 */
const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const openaiClient = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY });

    const response = await openaiClient.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return [];
  }
};

/**
 * Indexes all Markdown documents by generating embeddings for each chunk and storing them in memory.
 * Also updates the embeddings.json file if new embeddings are generated.
 * Handles cases where files have been updated and chunk counts have changed.
 */
export const indexMarkdownFiles = async (): Promise<void> => {
  const env = process.env.NODE_ENV;
  dotenv.config({
    path: [`.env.${env}.local`, `.env.${env}`, ".env.local", ".env"],
  });

  if (process.env.SKIP_DOC_EMBEDDINGS_INDEX === "true") return;

  const filePattern = `./docs/en/**/*.mdx`;
  const files = fg.sync(filePattern);

  let result: Record<string, number[]> = {}; // Object to hold updated embeddings
  const currentChunkKeys = new Set<string>(); // Track which chunks should exist

  // Iterate over each file key (identifier) in the combined files
  for await (const fileKey of files) {
    const file = await readFile(join(process.cwd(), fileKey), "utf8");
    // Get the metadata of the file
    const fileMetadata = getMarkdownMetadata(file);

    // Split the document into chunks based on headings
    const fileChunks = chunkText(file);

    // Check if the number of chunks has changed for this file
    const existingChunksForFile = Object.keys(embeddingsList).filter((key) =>
      key.startsWith(`${fileKey}/chunk_`)
    );
    const currentChunkCount = fileChunks.length;
    const previousChunkCount = existingChunksForFile.length;

    let shouldRegenerateFileEmbeddings = false;

    // If chunk count differs, we need to regenerate embeddings for this file
    if (currentChunkCount !== previousChunkCount) {
      console.info(
        `File "${fileKey}" chunk count changed: ${previousChunkCount} -> ${currentChunkCount}. Regenerating embeddings.`
      );
      shouldRegenerateFileEmbeddings = true;
    }

    // Iterate over each chunk within the current file
    for await (const chunkIndex of Object.keys(fileChunks)) {
      const chunkNumber = Number(chunkIndex) + 1; // Chunk number starts at 1
      const chunksNumber = fileChunks.length;

      const fileChunk = fileChunks[
        chunkIndex as keyof typeof fileChunks
      ] as string;

      const embeddingKeyName = `${fileKey}/chunk_${chunkNumber}`; // Unique key for the chunk
      currentChunkKeys.add(embeddingKeyName); // Track this chunk as current

      // Retrieve precomputed embedding if available and file hasn't changed
      const docEmbedding = !shouldRegenerateFileEmbeddings
        ? (embeddingsList[embeddingKeyName as keyof typeof embeddingsList] as
            | number[]
            | undefined)
        : undefined;

      let embedding = docEmbedding; // Use existing embedding if available and valid

      if (!embedding) {
        embedding = await generateEmbedding(fileChunk); // Generate embedding if not present or file changed
        console.info(`- Generated new embedding: ${embeddingKeyName}`);
      }

      // Update the result object with the embedding
      result = { ...result, [embeddingKeyName]: embedding };

      // Store the embedding and content in the in-memory vector store
      vectorStore.push({
        fileKey,
        chunkNumber,
        embedding,
        content: fileChunk,
        docUrl: fileMetadata.url,
        docName: fileMetadata.title,
      });

      console.info(`- Indexed: ${embeddingKeyName}/${chunksNumber}`);
    }
  }

  // Remove outdated embeddings that no longer exist in current docs
  const filteredEmbeddings: Record<string, number[]> = {};
  for (const [key, embedding] of Object.entries(embeddingsList)) {
    if (currentChunkKeys.has(key)) {
      // Only keep embeddings for chunks that still exist
      if (!result[key]) {
        filteredEmbeddings[key] = embedding as number[];
      }
    }
  }

  // Merge filtered existing embeddings with new ones
  result = { ...filteredEmbeddings, ...result };

  try {
    // Compare the newly generated embeddings with existing ones
    if (JSON.stringify(result) !== JSON.stringify(embeddingsList)) {
      // Create the generated folder if it doesn't exist
      mkdirSync("./src/generated", { recursive: true });

      // If there are new embeddings or changes, save them to embeddings.json
      writeFileSync(
        "./src/generated/embeddings.json",
        JSON.stringify(result, null, 2)
      );
    }
  } catch (error) {
    console.error(error); // Log any errors during the file write process
  }
};

// Automatically index Markdown files
indexMarkdownFiles();
