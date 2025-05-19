# Base image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl

# Copy all other source code
COPY . .

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
