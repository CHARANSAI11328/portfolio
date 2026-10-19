FROM node:20-alpine

WORKDIR /app

# Install dependencies first for efficient layer caching
COPY package.json ./
RUN npm install --omit=dev

# Copy application code and assets
COPY server/ ./server/
COPY public/ ./public/
COPY data/ ./data/

# Production environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server/index.js"]
