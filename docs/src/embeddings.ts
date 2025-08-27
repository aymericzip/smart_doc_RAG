import { OpenAI } from "openai";

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
export const generateEmbedding = async (text: string): Promise<number[]> => {
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

const OVERLAP_TOKENS: number = 200; // Number of tokens to overlap between chunks
const MAX_CHUNK_TOKENS: number = 800; // Maximum number of tokens per chunk
const CHAR_BY_TOKEN: number = 4.15; // Approximate pessimistically the number of characters per token // Can use `tiktoken` or other tokenizers to calculate it more precisely
const MAX_CHARS: number = MAX_CHUNK_TOKENS * CHAR_BY_TOKEN;
const OVERLAP_CHARS: number = OVERLAP_TOKENS * CHAR_BY_TOKEN;

/**
 * Splits a given text into chunks ensuring each chunk does not exceed MAX_CHARS.
 * @param text - The input text to split.
 * @returns - Array of text chunks.
 */
export const chunkText = (text: string): string[] => {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + MAX_CHARS, text.length);

    // Ensure we don't cut words in the middle (find nearest space)
    if (end < text.length) {
      const lastSpace = text.lastIndexOf(" ", end);
      if (lastSpace > start) {
        end = lastSpace;
      }
    }

    chunks.push(text.substring(start, end));

    // Move start forward correctly
    const nextStart = end - OVERLAP_CHARS;
    if (nextStart <= start) {
      // Prevent infinite loop if overlap is too large
      start = end;
    } else {
      start = nextStart;
    }
  }

  return chunks;
};

/**
 * Calculates the cosine similarity between two vectors.
 * Cosine similarity measures the cosine of the angle between two vectors in an inner product space.
 * Used to determine the similarity between chunks of text.
 *
 * @param vecA - The first vector
 * @param vecB - The second vector
 * @returns The cosine similarity score
 */
const cosineSimilarity = (vecA?: number[], vecB?: number[]): number => {
  if (!vecA || !vecB) return 0;

  // Calculate the dot product of the two vectors
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);

  // Calculate the magnitude (Euclidean norm) of each vector
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

  // Compute and return the cosine similarity
  return dotProduct / (magnitudeA * magnitudeB);
};

export type VectorStoreEl = {
  fileKey: string;
  chunkNumber: number;
  content: string;
  embedding?: number[];
};

const MAX_RELEVANT_CHUNKS_NB: number = 20; // Maximum number of relevant chunks to attach to chatGPT context
const MIN_RELEVANT_CHUNKS_SIMILARITY: number = 0.42; // Minimum similarity required for a chunk to be considered relevant

/**
 * Searches the indexed documents for the most relevant chunks based on a query.
 * Utilizes cosine similarity to find the closest matching embeddings.
 *
 * @param query - The search query provided by the user
 * @returns An array of the top matching document chunks' content
 */
export const searchChunkReference = async (
  queryEmbedding: number[],
  vectorStore: VectorStoreEl[],
  maxResults: number = MAX_RELEVANT_CHUNKS_NB,
  minSimilarity: number = MIN_RELEVANT_CHUNKS_SIMILARITY
): Promise<VectorStoreEl[]> => {
  // Calculate similarity scores between the query embedding and each document's embedding
  const selection = vectorStore
    .map((chunk) => ({
      ...chunk,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding), // Add similarity score to each doc
    }))
    .filter((chunk) => chunk.similarity > minSimilarity) // Filter out documents with low similarity scores
    .sort((a, b) => b.similarity - a.similarity) // Sort documents by highest similarity first
    .slice(0, maxResults); // Select the top 6 most similar documents

  const orderedDocKeys = new Set(selection.map((chunk) => chunk.fileKey));

  const orderedVectorStore = vectorStore.sort((a, b) =>
    orderedDocKeys.has(a.fileKey) ? -1 : 1
  );

  const results = orderedVectorStore.filter((chunk) =>
    selection.some(
      (v) => v.fileKey === chunk.fileKey && v.chunkNumber === chunk.chunkNumber
    )
  );

  // Return the content of the top matching documents
  return results;
};
