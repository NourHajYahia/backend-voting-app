const express = require('express');
const { MongoClient } = require('mongodb');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

// Initialize Express and create an HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // React app's origin
    methods: ["GET", "POST"]
  }
});

// Use CORS middleware before any routes or Socket.IO setup
app.use(cors({
  origin: "http://localhost:3000", // React app's origin
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));


const uri = 'mongodb://localhost:27017'; // Your MongoDB connection string
const dbName = 'vote'; // Your database name
const collectionName = 'VoteResult'; // Your collection name

async function watchAnimalVotes() {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });  
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Set up a change stream to watch for changes to the 'count' field
    const changeStream = collection.watch([
      {
        $match: {
          $or: [
            { 'operationType': 'update', 'updateDescription.updatedFields.count': { $exists: true } },
            { 'operationType': 'insert' }, // Also listen for new documents
            { 'operationType': 'replace' } 
          ]
        }
      }
    ], { fullDocument: 'updateLookup' }); // Ensure full documents are returned

    // Listen for changes
    changeStream.on('change', (change) => {
      console.log('Change detected:', change);
      
      // Full document after the change
      const updatedDocument = change.fullDocument;
      console.log('Updated document:', updatedDocument);

      // Process the change event (e.g., send to clients via WebSocket)
      // You can emit the updated document or specific fields
      io.emit('voteCountUpdated', updatedDocument);
    });

    console.log('Watching for changes on VoteResult collection...');
  } catch (err) {
    console.error('Error watching changes:', err);
  }
}

// Route to get all vote results
app.get('/api/vote-results', async (req, res) => {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Query all documents in the collection
    const results = await collection.find({}).toArray();
    res.json(results);
  } catch (err) {
    console.error('Error fetching vote results:', err);
    res.status(500).send('Internal Server Error');
  } finally {
    await client.close();
  }
});

watchAnimalVotes();

// Start the server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
