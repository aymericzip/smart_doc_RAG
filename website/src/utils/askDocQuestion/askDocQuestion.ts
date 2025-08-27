import { readFileSync } from "fs";
import { OpenAI } from "openai";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { searchDoc } from "@smart-doc/docs";
import { ChatCompletionRequestMessage } from "@components/ChatBot/MessagesList";

/*
 * Ask question AI configuration
 */
const MODEL: string = "chatgpt-4o-latest"; // Model to use for chat completions
const MODEL_TEMPERATURE: number = 0.1; // Temperature to use for chat completions

/**
 * Reads the content of a file synchronously.
 *
 * @function
 * @param relativeFilePath - The relative or absolute path to the target file.
 * @returns The entire contents of the specified file as a UTF-8 encoded string.
 */
const getFileContent = (relativeFilePath: string): string => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const absolutePath = join(__dirname, relativeFilePath);
  const fileContent = readFileSync(absolutePath, "utf-8");
  return fileContent;
};

const CHAT_GPT_PROMPT = getFileContent("./PROMPT.md");

// Initial prompt configuration for the chatbot
export const initPrompt = {
  role: "system",
  content: CHAT_GPT_PROMPT,
};

export type AskDocQuestionResult = {
  response: string;
  relatedFiles: string[];
};

export type AskDocQuestionOptions = {
  onMessage?: (chunk: string) => void;
};

/**
 * Handles the "Ask a question" endpoint in an Express.js route.
 * Processes user messages, retrieves relevant documents, and interacts with ChatGPT to generate responses.
 *
 * @param messages - An array of chat messages from the user and assistant
 * @returns The assistant's response as a string
 */
export const askDocQuestion = async (
  messages: ChatCompletionRequestMessage[],
  options?: AskDocQuestionOptions
): Promise<AskDocQuestionResult> => {
  // Format the user's question to keep only the relevant keywords
  const query = messages
    .filter((message) => message.role === "user")
    .map((message) => `- ${message.content}`)
    .join("\n");

  // 1) Find relevant documents based on the user's question
  const relevantFilesReferences = await searchDoc(query);

  // 2) Integrate the relevant documents into the initial system prompt
  const systemPrompt = initPrompt.content.replace(
    "{{relevantFilesReferences}}",
    relevantFilesReferences.length === 0
      ? "Not relevant file found related to the question."
      : relevantFilesReferences
          .map((doc, idx) =>
            [
              "-----",
              "---",
              `chunkId: ${idx}`,
              `docChunk: "${doc.chunkNumber}/${doc.fileKey.length}"`,
              `docName: "${doc.fileKey}"`,
              `---`,
              doc.content,
              `-----`,
            ].join("\n")
          )
          .join("\n\n") // Insert relevant docs into the prompt
  );

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_API_KEY,
  });

  // Format messages for ChatGPT
  const chatMessages = [
    {
      role: "system" as const,
      content: systemPrompt,
    },
    ...messages.slice(-8),
  ];

  // 3) Use ChatGPT to stream the response
  let fullResponse = "";

  try {
    const stream = await openai.chat.completions.create({
      model: MODEL,
      messages: chatMessages,
      temperature: MODEL_TEMPERATURE,
      stream: true,
    });

    // Process the stream
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullResponse += content;
        options?.onMessage?.(content);
      }
    }
  } catch (error) {
    console.error("Error streaming ChatGPT response:", error);
    throw new Error("Failed to get response from ChatGPT");
  }

  // 4) Extract unique related files
  const relatedFiles = [
    ...new Set(relevantFilesReferences.map((doc) => doc.fileKey)),
  ];

  // 5) Return the assistant's response to the user
  return {
    response: fullResponse ?? "Error: No result found",
    relatedFiles,
  };
};
