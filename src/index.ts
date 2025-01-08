/**
 *
 *
 * EXPRESS SERVER
 *
 *
 */

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

/**
 *
 *
 * EXAMPLE USAGE
 *
 *
 */

// fetch("http://localhost:3000/ask", {
//   method: "POST",
//   headers: {
//     "Content-Type": "application/json",
//   },
//   body: JSON.stringify({
//     messages: [
//       {
//         role: "user",
//         content: "Do the Rangers have a shared headquarters or base?",
//       },
//     ],
//   }),
// }).then((response) => {
//   console.log(response);
// });

// curl -X POST http://localhost:3000/ask \
// -H "Content-Type: application/json" \
// -d '{
//   "messages": [
//     {
//       "role": "user",
//       "content": "Do the Rangers have a shared headquarters or base?"
//     }
//   ]
// }'
