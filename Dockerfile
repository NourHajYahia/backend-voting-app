# Use the official Node.js image
FROM node:16

# Set working directory
WORKDIR /opt

# Install app dependencies
COPY package*.json ./

RUN npm install

# Copy app files
COPY . .

# Expose the port the app runs on
EXPOSE 5001

# Run the application
CMD ["node", "server.js"]
