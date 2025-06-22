# Use official Playwright base image with all browsers
FROM mcr.microsoft.com/playwright:v1.43.1-jammy

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

# Start your server (adjust if your entry point is different)
CMD ["node", "index.js"]
