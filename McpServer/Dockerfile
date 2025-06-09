FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose MCP server port
EXPOSE 3000

# Start the MCP server
CMD ["npm", "start"]