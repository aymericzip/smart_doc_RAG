# Smart Documentation Chatbot

![Online Demo](https://github.com/aymericzip/smart_doc/blob/main/assets/chat_screenshot.png)

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Architecture](#architecture)
- [Demo](#demo)
- [Installation](#installation)
- [Usage](#usage)

## Introduction

Welcome to the **Smart Documentation Chatbot** repository! This project showcases a chatbot designed to intelligently navigate and provide information from your documentation. Leveraging OpenAI's embeddings, the chatbot efficiently indexes, searches, and retrieves relevant content to answer user queries seamlessly.

Whether your documentation is in Markdown files, stored in a database, or managed through a CMS, this chatbot framework can be adapted to suit your needs.

## Features

- **Automatic Documentation Indexing**: Scans and reads Markdown (`.md`) files from specified directories.
- **Text Chunking with Overlap**: Splits large documents into manageable chunks with overlapping tokens to maintain context.
- **Embedding Generation**: Utilizes OpenAI's `text-embedding-3-large` model to generate embeddings for each text chunk.
- **Efficient Vector Storage**: Stores embeddings locally in a JSON file for quick access and avoids redundant computations.
- **Vector Similarity Search**: Implements cosine similarity to find the most relevant chunks in response to user queries.
- **Express.js Backend**: Handles API requests, processes user queries, and interacts with OpenAI's Chat Completion API.
- **React Frontend**: Provides a simple and intuitive chat interface for users to interact with the chatbot.
- **Live Demo Available**: Experience the chatbot in action through the live demo link.

## Architecture

The project is divided into three main components:

1. **Reading Documentation Files**: Scans designated folders for Markdown files and reads their content.
2. **Indexing the Documentation**:
   - **Chunking**: Splits documents into chunks with overlapping tokens.
   - **Embedding Generation**: Creates embeddings for each chunk using OpenAI's API.
   - **Storage**: Saves embeddings locally to prevent redundant generation.
3. **Searching the Documentation**:
   - **Vector Similarity**: Uses cosine similarity to match user queries with relevant document chunks.
   - **Integration with Chatbot**: Feeds relevant chunks into the ChatGPT context to generate accurate responses.

## Demo

Check out a demo for my Intlayer project [**here**](https://intlayer.org/doc/chat).

## Installation

Follow these steps to set up the project locally.

### Clone the Repository

```bash
git clone https://github.com/aymericzip/smart_doc.git
cd smart_doc
```

### Install Dependencies

```bash
npm install
```

### Configure OpenAI API Key

Fill your OpenAI API key in the `OPENAI_API_KEY` variable in the `src/askDocQuestion.ts` file.

### Start the Server

```bash
npm start
```

## Usage

To test the chatbot's API, you can use either JavaScript (with `fetch`) or `curl` in your terminal. Below are examples of how to perform queries using both methods.

### Using JavaScript

Here's an example of how to query the chatbot using JavaScript's `fetch` API:

```javascript
fetch("http://localhost:3000/ask", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    messages: [
      {
        role: "user",
        content: "What is the purpose of this library?",
      },
    ],
  }),
})
  .then((response) => response.json())
  .then((data) => {
    console.log("Chatbot Response:", data);
  })
  .catch((error) => {
    console.error("Error:", error);
  });
```

**Explanation:**

- **Endpoint**: `http://localhost:3000/ask` - Ensure the backend server is running on port 3000.
- **Method**: `POST` - Sending a POST request with JSON payload.
- **Headers**: Specifies that the content type is JSON.
- **Body**: Contains the user's message in the required format.

### Using `curl` in Bash

Alternatively, you can use `curl` to send a POST request from your terminal:

```bash
curl -X POST http://localhost:3000/ask \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Do the Rangers have a shared headquarters or base?"
      }
    ]
  }'
```

**Explanation:**

- **`-X POST`**: Specifies the POST method.
- **`-H "Content-Type: application/json"`**: Sets the header to indicate JSON content.
- **`-d '...'`**: Provides the JSON payload with the user's message.

**Sample Response:**

```json
"Yes, the Rangers have a shared headquarters known as the Command Center. It serves as their base of operations where they plan missions, store their equipment, and coordinate their efforts to protect the city from various threats."
```

**Note:** Replace the content of the `messages` array with your desired query to test different responses from the chatbot.
