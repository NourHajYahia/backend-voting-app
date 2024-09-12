const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');  
require('dotenv').config();
const mongoose = require('mongoose');


// Now you can use these variables in your application
const mongoUrl = process.env.DB_URL;
const fronUrl = process.env.FRONT_URL;

console.log(`Connecting to front at ${fronUrl}`);
console.log(`Connecting to mongo at ${mongoUrl}`);


// Initialize Express and create an HTTP server
const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: { origin: '*' }
});

// Use CORS middleware before any routes or Socket.IO setup
app.use(cors());

mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});


const voteResultSchema = new mongoose.Schema({
  animal: String,
  count: Number,
},{collection: 'VoteResult'});

// Create a Vote model
const VoteResult = mongoose.model('VoteResult', voteResultSchema);

async function watchAnimalVotes() {
  try {
    const changeStream = VoteResult.watch([], { fullDocument: 'updateLookup' }); 

    // Listen for changes
    changeStream.on('change', (change) => {
      console.log('Change detected:', change);
      
      // Full document after the change
      // const updatedDocument = JSON.stringify(change);
      console.log('Updated document:', change);

      // Process the change event (e.g., send to clients via WebSocket)
      // You can emit the updated document or specific fields
      io.emit('voteCountUpdated', change);
    });

    console.log('Watching for changes on VoteResult collection...');
  } catch (err) {
    console.error('Error watching changes:', err);
  }
}

// Route to get all vote results
app.get('/api/vote-results', async (req, res) => {

  try {
    const votes = await VoteResult.find();
    res.json(votes);
  } catch (err) {
    console.error('Error fetching vote results:', err);
    res.status(500).send('Internal Server Error');
  }
});

watchAnimalVotes();


// Start the server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
