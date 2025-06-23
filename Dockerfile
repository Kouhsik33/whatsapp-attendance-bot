# ✅ Use updated Playwright image with v1.53.1
FROM mcr.microsoft.com/playwright:v1.53.1-jammy

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your app
COPY . .

# Expose port (optional, useful if testing locally)
EXPOSE 10000

# Start your server
CMD ["node", "index.js"]
