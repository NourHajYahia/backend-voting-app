# Use the official Node.js image
FROM node:16

# Set working directory
WORKDIR /opt

# Install app dependencies
COPY package*.json ./

RUN npm install

# Copy app files
COPY . .

# Run the application
CMD ["node", "server.js"]
