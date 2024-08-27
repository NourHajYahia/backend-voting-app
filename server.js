const express = require('express');
const redis = require('redis');
const app = express();
const port = 6000;

// Create a Redis client
const client = redis.createClient();

// Middleware to parse JSON
app.use(express.json());

// Initialize Redis with default values if not already set
client.hSet('votes', 'dogs', 0);
client.hSet('votes', 'cats', 0);

// Route to get vote counts
app.get('/votes', (req, res) => {
  client.hGetAll('votes', (err, votes) => {
    if (err) return res.status(500).send(err);
    res.json(votes);
  });
});

// Route to cast a vote
app.post('/vote', (req, res) => {
  const { option } = req.body;
  if (!['dogs', 'cats'].includes(option)) {
    return res.status(400).send('Invalid option');
  }

  client.hIncrBy('votes', option, 1, (err, newCount) => {
    if (err) return res.status(500).send(err);
    res.json({ option, count: newCount });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
