const express = require('express');
const { MongoClient } = require('mongodb');
const http = require('http');
const socketIo = require('socket.io');

// Initialize Express and create an HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(cors());

const uri = 'mongodb://localhost:27017'; // Your MongoDB connection string
const dbName = 'vote'; // Your database name
const collectionName = 'VoteResult'; // Your collection name

async function watchAnimalVotes() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Set up a change stream to watch for changes to the 'count' field
    const changeStream = collection.watch([
      {
        $match: {
          'updateDescription.updatedFields.count': { $exists: true }
        }
      }
    ]);

    // Listen for changes
    changeStream.on('change', (change) => {
      console.log('Change detected:', change);
      
      // Full document after the change
      const updatedDocument = change.fullDocument;
      console.log('Updated document:', updatedDocument);

      // Process the change event (e.g., send to clients via WebSocket)
      // You can emit the updated document or specific fields
      // io.emit('voteCountUpdated', updatedDocument);
    });

    console.log('Watching for changes on VoteResult collection...');
  } catch (err) {
    console.error('Error watching changes:', err);
  }
}

watchAnimalVotes();

// Start the server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
