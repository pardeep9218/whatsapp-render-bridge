# Use an official, pre-configured image that already has Chrome and Node installed
FROM ghcr.io/puppeteer/puppeteer:22.6.0

# Set up the working directory inside the container
WORKDIR /app

# Copy dependency mappings
COPY package*.json ./

# Switch temporarily to root to handle file permissions cleanly
USER root

# Install dependencies safely
RUN npm install

# Copy your remaining source files over
COPY . .

# Set proper ownership permissions for security compliance 
RUN chown -R pptruser:pptruser /app

# Switch back to the safe, unprivileged Puppeteer user profile
USER pptruser

# Open port 3000 for server operations
EXPOSE 3000

# Fire up the engine script
CMD ["node", "server.js"]
