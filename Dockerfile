# Base image using official Ubuntu
FROM ubuntu:latest

# Avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install prerequisites, curl, and certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20 LTS from NodeSource
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy backend package manifests
COPY backend/package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy backend source code into container app root
COPY backend/ .

# Expose backend port
EXPOSE 5700

# Environment variables
ENV PORT=5700 \
    NODE_ENV=production

# Start the application
CMD ["npm", "start"]
