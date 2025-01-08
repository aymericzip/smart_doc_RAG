# Building a Smart Documentation, based on OpenAI Embeddings (Chunking, Indexing, and Searching)

Hey everyone! I wanted to share my approach to creating a “smart documentation” chatbot for a project I'm working on. **I’m not an AI expert, so any suggestions or improvements are more than welcome!**

The purpose of this post is not to create another tutorial on building a chatbot based on OpenAI. There's already plenty of content on that topic.
Instead, the main idea is to **index documentation**, by splitting them into manageable **chunks**, generating **embeddings** with OpenAI, and **performing a similarity search** to find and return the most relevant information to a user's query.

In my case, the documentation will be Markdown files, but it can be any form of text, database object, etc.

## Why?

Because it can sometimes be hard to find the information you need, I wanted to create a chatbot that could answer questions about a specific topic, and provide relevant context from the documentation.

This assistant can be used in a variety of ways, such as:

- Providing quick answers to frequently asked questions
- Helping users find the information they need
- Troubleshoot, review or transform the user's code

---

## Summary

Below, I’ll outline the three major parts of my solution:

1. Reading documentation files
2. Indexing the documentation (chunking, overlap, and embedding)
3. Searching the documentation (and hooking it up to a chatbot)

## File tree

```bash
.
└── docs
    └── ...md
└── src
    └── askDocQuestion.ts
    └── index.ts # Express.js application endpoint
└── embeddings.json # Storage for embeddings
└── packages.json
```

---

## 1. Reading Documentation Files

Instead of hardcoding the documentation text, you can scan a folder for `.md` files using tools like `glob`.

```ts
// Example snippet of fetching files from a folder:
import fs from "node:fs";
import path from "node:path";
import glob from "glob";

const DOC_FOLDER_PATH = "./docs";

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
```

> As an alternative, you can of course fetch your documentation from your database or CMS etc.

---

## 2. Indexing the Documentation

To create our search engine, we will use OpenAI's [vector embeddings API](https://platform.openai.com/docs/guides/embeddings) to generate our embeddings.

Vector embeddings are a way to represent data in a numerical format, which can be used to perform similarity searches (in our case, between the user question, and our documentations sections).

This vector, constituted of a list of floating point numbers, will be used to calculate the similarity using a mathematical formula.

```js
[
  -0.0002630692, -0.029749284, 0.010225477, -0.009224428, -0.0065269712,
  -0.002665544, 0.003214777, 0.04235309, -0.033162255, -0.00080789323,
  //...+1533 elements
];
```

> Based on this concept, was created [Vector Database](https://www.cloudflare.com/learning/ai/what-is-vector-database/). As a result, instead of using the OpenAI API, it's possible to use a vector database like [Chroma](https://www.trychroma.com/), [Qdrant](https://qdrant.tech/) or [Pinecone](https://www.pinecone.io/).

### 2.1 Chunk Each File & Overlap

Large blocks of text can exceed model context limits or cause less relevant hits, so it's recommended to split them into chunks to make the search more targeted.
However, to preserve some continuity between chunks, we overlap them by a certain number of tokens (or characters). That way, chunk boundaries are less likely to cut off relevant context mid-sentence.

#### Example of chunking

In this example, we have a long text that we want to split into smaller chunks.
In this case, we want to create chunks of 100 characters and overlap them by 50 characters.

**Full Text (406 characters):**

_In the heart of the bustling city, there stood an old library that many had forgotten. Its towering shelves were filled with books from every imaginable genre, each whispering stories of adventures, mysteries, and timeless wisdom. Every evening, a dedicated librarian would open its doors, welcoming curious minds eager to explore the vast knowledge within. Children would gather for storytelling sessions._

- **Chunk 1 (Characters 1-150):**

  _In the heart of the bustling city, there stood an old library that many had forgotten. Its towering shelves were filled with books from every imaginabl._

- **Chunk 2 (Characters 101-250):**

  _shelves were filled with books from every imaginable genre, each whispering stories of adventures, mysteries, and timeless wisdom. Every evening, a d_

- **Chunk 3 (Characters 201-350):**

  _ysteries, and timeless wisdom. Every evening, a dedicated librarian would open its doors, welcoming curious minds eager to explore the vast knowledge_

- **Chunk 4 (Characters 301-406):**

  _curious minds eager to explore the vast knowledge within. Children would gather for storytelling sessions._

#### Code Snippet

```ts
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
```

> To learn more about chunking, and the impact of the size on the embedding, you can check out [this article](https://www.restack.io/p/embeddings-answer-openai-embeddings-chunk-size-cat-ai).

### 2.2 Embedding Generation

Once a file is chunked, we generate vector embeddings for each chunk using OpenAI’s API (e.g., `text-embedding-ada-002`).

```ts
import { OpenAI } from "openai";

const EMBEDDING_MODEL: OpenAI.Embeddings.EmbeddingModel =
  "text-embedding-ada-002"; // Model to use for embedding generation

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const generateEmbedding = async (textChunk: string): Promise<number[]> => {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: textChunk,
  });

  return response.data[0].embedding; // Return the generated embedding
};
```

### 2.3 Generating and Save Embeddings for the whole file

To avoid regenerating embeddings every time, we will store the embeddings. It can be store in a database. But in this case, we will simply store it in a JSON file locally.

The following code simply :

1. iterates over each document,
2. chunks the document into chunks,
3. generates embeddings for each chunk,
4. stores the embeddings in a JSON file.
5. Fill the `vectorStore` with the embeddings to be used in the search.

```ts
import embeddingsList from "../embeddings.json";

/**
 * Simple in-memory vector store to hold document embeddings and their content.
 * Each entry contains:
 * - filePath: A unique key identifying the document
 * - chunkNumber: The number of the chunk within the document
 * - content: The actual text content of the chunk
 * - embedding: The numerical embedding vector for the chunk
 */
const vectorStore: {
  filePath: string;
  chunkNumber: number;
  content: string;
  embedding: number[];
}[] = [];

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
```

---

## 3. Searching the Documentation

### 3.1 Vector Similarity

To answer a user’s question, we first generate an embedding for the **user question** and then compute the cosine similarity between the query embedding and each chunk’s embedding. We filter out anything below a certain similarity threshold and keep only the top X matches.

```ts
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
const searchChunkReference = async (query: string) => {
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
```

### 3.2 Prompting OpenAI with Relevant Chunks

After sorting, we feed the **top** chunks into the system prompt of the ChatGPT request. This means ChatGPT sees the most relevant sections of your docs as if you had typed them into the conversation. Then we let ChatGPT form an answer for the user.

```ts
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
        ...\
        Here is the relevant documentation:\
        " +
        relevantChunks
          .map(
            (doc, idx) =>
              `[Chunk ${idx}] filePath = "${doc.filePath}":\n${doc.content}`
          )
          .join("\n\n"), // Insert relevant chunks into the prompt
    },
    ...messages, // Include the chat history
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
```

---

## 4. Implement OpenAI API for Chatbot Using Express

To execute our system we will use an Express.js server.
Here an example of a small Express.js endpoint to handle the query:

```ts
import express, { type Request, type Response } from "express";
import {
  ChatCompletionRequestMessage,
  askDocQuestion,
  indexMarkdownFiles,
} from "./askDocQuestion";

// Automatically fill the vector store with embeddings when server starts
indexMarkdownFiles();

const app = express();

// Parse incoming requests with JSON payloads
app.use(express.json());

type AskRequestBody = {
  messages: ChatCompletionRequestMessage[];
};

// Routes
app.post(
  "/ask",
  async (
    req: Request<undefined, undefined, AskRequestBody>,
    res: Response<string>
  ) => {
    try {
      const response = await askDocQuestion(req.body.messages);

      res.json(response);
    } catch (error) {
      console.error(error);
    }
  }
);

// Start server
app.listen(3000, () => {
  console.log(`Listening on port 3000`);
});
```

---

## 5. UI: Making a Chatbot Interface

On the frontend, I built a small React component with a chat-like interface. It sends messages to my Express backend and displays the replies. Nothing too fancy, so we’ll skip the details.

---

## Code template

I made a [code template](https://github.com/aymericzip/smart_doc) for you to use as a starting point for your own chatbot.

## Live Demo

If you want a test the final implement this chatbot, check out this [**demo page**](https://intlayer.org/doc/chat)

### My demo Code

- **Backend**: [askDocQuestion.ts](https://github.com/aymericzip/intlayer/blob/main/apps/backend/src/utils/AI/askDocQuestion.ts)
- **Frontend**: [ChatBot components](https://github.com/aymericzip/intlayer/tree/main/apps/website/src/components/ChatBot)

## Go Further

On Youtube, have a look at this [video of Adrien Twarog](https://www.youtube.com/watch?v=ySus5ZS0b94) as treat of OpenAI Embeddings and Vector Databases

I also stumbled upon [OpenAI’s Assistants File Search documentation](https://platform.openai.com/docs/assistants/tools/file-search), which might be interesting if you want an alternative approach.

---

## Conclusion

I hope this gives you an idea of how to handle documentation indexing for a chatbot:

- Using chunking + overlap so that the right context is found,
- Generating embeddings and storing them for quick vector similarity searches,
- Finally handing it off to ChatGPT with the relevant context.

I’m not an AI expert—this is just a solution that I found works well for my needs. If you have any tips on improving efficiency or a more polished approach, **please let me know**. I’d love to hear feedback on vector storage solutions, chunking strategies, or any other performance tips.

**Thanks for reading and feel free to share your thoughts!**
