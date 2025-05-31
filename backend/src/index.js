import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { handleAuctionWS, auctions } from './auction.js';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Redis connection
const redis = new Redis(process.env.REDIS_URL);

// BullMQ queue for bids
export const bidQueue = new Queue('bids', { connection: redis });

// WebSocket server
const wss = new WebSocketServer({ server, path: process.env.WS_PATH || '/ws' });
wss.on('connection', (ws) => handleAuctionWS(ws, wss));

// Express REST API (basic health check)
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/', (req, res) => res.send('Auction backend is running!'));
app.get('/auctions', (req, res) => {
  res.json(auctions);
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Auction backend running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}${process.env.WS_PATH || '/ws'}`);
}); 