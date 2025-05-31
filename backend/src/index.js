import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { handleAuctionWS, auctions } from './auction.js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Root route
app.get('/', (req, res) => {
  res.send('Auction backend is running!');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
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

// Handle WebSocket connections
wss.on('connection', (ws) => {
  handleAuctionWS(ws, wss);
});

// Start server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 