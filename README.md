# Smart Documentation Chatbot

An easy-to-use framework that turns your project documentation into a chatbot you can ask anything.

![Online Demo](https://github.com/aymericzip/smart_doc/blob/main/assets/demo_compressed.gif)

## Introduction

Free TypeScript template for a **Smart Documentation Chatbot**.

This project indexes your documentation and lets you query it through a chatbot.

It replicates how the [Intlayer documentation](https://intlayer.org/doc/get-started) works.

How it works:

1. We use OpenAI embeddings and store them in a JSON file.
2. We then use vector similarity search to find the documents most relevant to the user query.
3. We return the most relevant documents to the user.

## Architecture

The project is divided into three main components:

1. **docs**
   - We index the docs
   - We store embeddings in a JSON file
2. **website** (Next.js)
   - Renders and interprets the docs using `intlayer` and Next.js route handlers
   - Uses OpenAI vector similarity search to find the most relevant documents
   - Returns the most relevant results to the user

## How it works

1. List and index all available documentation
2. Generate an embedding for each document using OpenAI
3. Store embeddings in a JSON file
4. When a user asks a question or searches for a doc:
   - Generate a new embedding for the user's query
   - Use vector similarity search to find the most relevant documents
   - Retrieve the top matching documents
5. Return the most relevant documents to the user

## Demo

Check out a demo for my Intlayer project [**here**](https://intlayer.org/doc/chat).

## Installation

### Clone the Repository

```bash
git clone https://github.com/aymericzip/smart_doc.git
cd smart_doc
```

### Install Dependencies

```bash
npm install -g pnpm
pnpm install
```

### Configure the .env files

You can find two .env template files in the project:

- `website/.env.template`
- `docs/.env.template`

Rename these files to `.env` and fill the variables with your own values.

### Build the project

```bash
pnpm run build
```

### Start the project

```bash
cd website
pnpm run start
```
