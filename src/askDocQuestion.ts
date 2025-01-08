// index.ts

import fs from "node:fs";
import glob from "fast-glob";

const DOC_FOLDER_PATH = "./docs";

/**
 *
 *
 * READING FILES
 *
 *
 */

type FileData = {
  path: string;
  content: string;
};

const readAllMarkdownFiles = (): FileData[] => {
  const filesContent: FileData[] = [];
  const filePaths = glob.sync(`${DOC_FOLDER_PATH}/**/*.md`);

  filePaths.forEach((filePath) => {
    const content = fs.readFileSync(filePath, "utf8");
    filesContent.push({ path: filePath, content });
  });

  return filesContent;
};

/**
 *
 *
 * CHUNKING
 *
 *
 */

const CHARS_PER_TOKEN = 4.15; // Approximate pessimistically number of characters per token. Can use `tiktoken` or other tokenizers to calculate it more precisely

const MAX_TOKENS = 500; // Maximum number of tokens per chunk
const OVERLAP_TOKENS = 100; // Number of tokens to overlap between chunks

const maxChar = MAX_TOKENS * CHARS_PER_TOKEN;
const overlapChar = OVERLAP_TOKENS * CHARS_PER_TOKEN;

const chunkText = (text: string): string[] => {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + maxChar, text.length);

    // Don’t cut a word in half if possible:
    if (end < text.length) {
      const lastSpace = text.lastIndexOf(" ", end);
      if (lastSpace > start) end = lastSpace;
    }

    chunks.push(text.substring(start, end));
    // Overlap management
    const nextStart = end - overlapChar;
    start = nextStart <= start ? end : nextStart;
  }

  return chunks;
};

/**
 *
 *
 * EMBEDDING GENERATION
 *
 *
 */

import { OpenAI } from "openai";

const EMBEDDING_MODEL: OpenAI.Embeddings.EmbeddingModel =
  "text-embedding-3-large"; // Model to use for embedding generation
const OPENAI_API_KEY: string = "...";

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const generateEmbedding = async (textChunk: string): Promise<number[]> => {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: textChunk,
  });

  return response.data[0].embedding; // Return the generated embedding
};

/**
 *
 *
 * FILE INDEXING
 *
 *
 */

import embeddingsList from "../embeddings.json";

type VectorStoreEl = {
  filePath: string;
  chunkNumber: number;
  content: string;
  embedding: number[];
};

/**
 * Simple in-memory vector store to hold document embeddings and their content.
 * Each entry contains:
 * - filePath: A unique key identifying the document
 * - chunkNumber: The number of the chunk within the document
 * - content: The actual text content of the chunk
 * - embedding: The numerical embedding vector for the chunk
 */
const vectorStore: VectorStoreEl[] = [];

/**
 * Indexes all Markdown documents by generating embeddings for each chunk and storing them in memory.
 * Also updates the embeddings.json file if new embeddings are generated.
 */
export const indexMarkdownFiles = async (): Promise<void> => {
  // Retrieve documentations
  const docs = readAllMarkdownFiles();

  let newEmbeddings: Record<string, number[]> = {};

  for (const doc of docs) {
    // Split the document into chunks based on headings
    const fileChunks = chunkText(doc.content);

    // Iterate over each chunk within the current file
    for (const chunkIndex of Object.keys(fileChunks)) {
      const chunkNumber = Number(chunkIndex) + 1; // Chunk number starts at 1
      const chunksNumber = fileChunks.length;

      const chunk = fileChunks[chunkIndex as keyof typeof fileChunks] as string;

      const embeddingKeyName = `${doc.path}/chunk_${chunkNumber}`; // Unique key for the chunk

      // Retrieve precomputed embedding if available
      const existingEmbedding = embeddingsList[
        embeddingKeyName as keyof typeof embeddingsList
      ] as number[] | undefined;

      let embedding = existingEmbedding; // Use existing embedding if available

      if (!embedding) {
        embedding = await generateEmbedding(chunk); // Generate embedding if not present
      }

      newEmbeddings = { ...newEmbeddings, [embeddingKeyName]: embedding };

      // Store the embedding and content in the in-memory vector store
      vectorStore.push({
        filePath: doc.path,
        chunkNumber,
        embedding,
        content: chunk,
      });

      console.info(`- Indexed: ${embeddingKeyName}/${chunksNumber}`);
    }
  }

  /**
   * Compare the newly generated embeddings with existing ones
   *
   * If there is change, update the embeddings.json file
   */
  try {
    if (JSON.stringify(newEmbeddings) !== JSON.stringify(embeddingsList)) {
      fs.writeFileSync(
        "./embeddings.json",
        JSON.stringify(newEmbeddings, null, 2)
      );
    }
  } catch (error) {
    console.error(error);
  }
};

/**
 *
 *
 * SEARCHING
 *
 *
 */

/**
 * Calculates the cosine similarity between two vectors.
 * Cosine similarity measures the cosine of the angle between two vectors in an inner product space.
 * Used to determine the similarity between chunks of text.
 *
 * @param vecA - The first vector
 * @param vecB - The second vector
 * @returns The cosine similarity score
 */
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  // Calculate the dot product of the two vectors
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);

  // Calculate the magnitude (Euclidean norm) of each vector
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

  // Compute and return the cosine similarity
  return dotProduct / (magnitudeA * magnitudeB);
};

const MIN_RELEVANT_CHUNKS_SIMILARITY = 0.77; // Minimum similarity required for a chunk to be considered relevant
const MAX_RELEVANT_CHUNKS_NB = 15; // Maximum number of relevant chunks to attach to chatGPT context

/**
 * Searches the indexed documents for the most relevant chunks based on a query.
 * Utilizes cosine similarity to find the closest matching embeddings.
 *
 * @param query - The search query provided by the user
 * @returns An array of the top matching document chunks' content
 */
const searchChunkReference = async (
  query: string
): Promise<VectorStoreEl[]> => {
  // Generate an embedding for the user's query
  const queryEmbedding = await generateEmbedding(query);

  // Calculate similarity scores between the query embedding and each document's embedding
  const results = vectorStore
    .map((doc) => ({
      ...doc,
      similarity: cosineSimilarity(queryEmbedding, doc.embedding), // Add similarity score to each doc
    }))
    // Filter out documents with low similarity scores
    // Avoid to pollute the context with irrelevant chunks
    .filter((doc) => doc.similarity > MIN_RELEVANT_CHUNKS_SIMILARITY)
    .sort((a, b) => b.similarity - a.similarity) // Sort documents by highest similarity first
    .slice(0, MAX_RELEVANT_CHUNKS_NB); // Select the top most similar documents

  // Return the content of the top matching documents
  return results;
};

/**
 *
 *
 * CHAT COMPLETION
 *
 *
 */

const MODEL: OpenAI.Chat.ChatModel = "gpt-4o-2024-11-20"; // Model to use for chat completions

// Define the structure of messages used in chat completions
export type ChatCompletionRequestMessage = {
  role: "system" | "user" | "assistant"; // The role of the message sender
  content: string; // The text content of the message
};

/**
 * Handles the "Ask a question" endpoint in an Express.js route.
 * Processes user messages, retrieves relevant documents, and interacts with OpenAI's chat API to generate responses.
 *
 * @param messages - An array of chat messages from the user and assistant
 * @returns The assistant's response as a string
 */
export const askDocQuestion = async (
  messages: ChatCompletionRequestMessage[]
): Promise<string> => {
  // Assistant's response are filtered out otherwise the chatbot will be stuck in a self-referential loop
  // Note that the embedding precision will be lowered if the user change of context in the chat
  const userMessages = messages.filter((message) => message.role === "user");

  // Format the user's question to keep only the relevant keywords
  const formattedUserMessages = userMessages
    .map((message) => `- ${message.content}`)
    .join("\n");

  // 1) Find relevant documents based on the user's question
  const relevantChunks = await searchChunkReference(formattedUserMessages);

  // 2) Integrate the relevant documents into the initial system prompt
  const messagesList: ChatCompletionRequestMessage[] = [
    {
      role: "system",
      content:
        "Ignore all previous instructions. \
        You're an helpful chatbot.\
        You will answer question regarding the life of power rangers.\
        If the information asked by the user is not provided into the provided chunks. You should suggest other questions.\
        Here is the relevant documentation:" +
        relevantChunks
          .map(
            (doc, idx) =>
              `[Chunk ${idx}] filePath = "${doc.filePath}":\n${doc.content}`
          )
          .join("\n\n"), // Insert relevant chunks into the prompt
    },
    ...messages, // Include all user and assistant messages
  ];

  // 3) Send the compiled messages to OpenAI's Chat Completion API (using a specific model)
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: messagesList,
  });

  const result = response.choices[0].message.content; // Extract the assistant's reply

  if (!result) {
    throw new Error("No response from OpenAI");
  }

  return result;
};
