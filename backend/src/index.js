import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { handleAuctionWS, auctions } from './auction.js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Middleware to parse JSON bodies
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send('Auction backend is running...');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Create new auction
app.post('/auctions', (req, res) => {
  try {
    const { id, title, description, startingPrice } = req.body;

    // Validate required fields
    if (!id || !title || !description || !startingPrice) {
      return res.status(400).json({
        error: 'Missing required fields. Please provide id, title, description, and startingPrice'
      });
    }

    // Check if auction already exists
    if (auctions[id]) {
      return res.status(409).json({
        error: 'Auction with this ID already exists'
      });
    }

    // Create new auction
    auctions[id] = {
      id,
      title,
      description,
      startingPrice,
      currentPrice: startingPrice,
      bids: [],
      createdAt: new Date().toISOString()
    };

    // Broadcast to all WebSocket clients
    const wss = app.get('wss');
    if (wss) {
      wss.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            type: 'auction_created',
            payload: { auction: auctions[id] }
          }));
        }
      });
    }

    res.status(201).json(auctions[id]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all auctions
app.get('/auctions', (req, res) => {
  res.json(auctions);
});

// Get specific auction
app.get('/auctions/:id', (req, res) => {
  const auction = auctions[req.params.id];
  if (!auction) {
    return res.status(404).json({ error: 'Auction not found' });
  }
  res.json(auction);
});

// Get bids for specific auction
app.get('/auctions/:id/bids', (req, res) => {
  const auction = auctions[req.params.id];
  if (!auction) {
    return res.status(404).json({ error: 'Auction not found' });
  }
  res.json(auction.bids);
});

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Store WebSocket server instance in app for broadcasting
app.set('wss', wss);

// Handle WebSocket connections
wss.on('connection', (ws) => {
  handleAuctionWS(ws, wss);
});

// Start server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 