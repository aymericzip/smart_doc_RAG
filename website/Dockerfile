# syntax=docker/dockerfile:1.7-labs

FROM node:24-alpine AS builder

RUN npm install -g pnpm@10.12.1


ARG NEXT_PUBLIC_URL
ARG SKIP_DOC_EMBEDDINGS_INDEX

ENV NEXT_PUBLIC_URL=${NEXT_PUBLIC_URL}
ENV SKIP_DOC_EMBEDDINGS_INDEX=${SKIP_DOC_EMBEDDINGS_INDEX} 

# Create app directory
WORKDIR /workspace

# Copy the rest of the source code
# Remove directories to keep the image slim
COPY  . .

# Installer toutes les dépendances (dev + prod) (frozen for reproducible builds)
RUN pnpm install --frozen-lockfile

# Build every package in the workspace (uses the root "build" script)
RUN pnpm run build

# Set working directory to the website package and build it
WORKDIR /workspace/website

ENV NODE_ENV=production

# Build the Next.js website
RUN pnpm run build

WORKDIR /workspace

# Remove .ts, .tsx and .map files only within src/** directories, ignoring node_modules, so configuration files like intlayer.config.ts are kept
RUN find . -path "*/src/*" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.map" \) -not -path "*/node_modules/*" -delete

# Remove all dev dependencies
RUN pnpm prune --prod

WORKDIR /workspace/website

# Create and use a non-root user for security
RUN addgroup -S app && adduser -S app -G app && chown -R app:app ./.next

USER app

# Expose the API port (defaults to 3100 via .env, can be overridden)
EXPOSE 3000

CMD ["pnpm", "start"] 