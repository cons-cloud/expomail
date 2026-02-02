# Dockerfile for HyperEmail
# Based on Node 20
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
# copy dataconnect-generated package reference if present
COPY src/dataconnect-generated/package.json ./src/dataconnect-generated/package.json
RUN npm ci --no-optional

# Copy source
COPY . .

# Build step if any (kept safe)
RUN npm run build || true

# Expose port
EXPOSE 3000

# Default command
CMD ["sh", "-c", "NODE_ENV=production node -r dotenv/config server.js"]
