import { bidQueue } from './index.js';
import { Worker } from 'bullmq';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// In-memory auction state
export const auctions = {};

// Broadcast to all clients
function broadcast(wss, data) {
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  });
}

// Simulate consensus (majority accept)
async function consensusSimulate(bid) {
  // In real world, use Paxos/Raft or distributed lock
  // Here, we simulate with a random majority
  const acceptors = 3;
  let accepted = 0;
  for (let i = 0; i < acceptors; i++) {
    if (Math.random() > 0.2) accepted++;
  }
  return accepted > acceptors / 2;
}

// BullMQ worker to process bids
new Worker('bids', async job => {
  const { auctionId, bid } = job.data;
  const ok = await consensusSimulate(bid);
  if (!ok) {
    // Bid rejected
    await redis.publish('auction', JSON.stringify({ type: 'bid_rejected', payload: { auctionId, bidId: bid.id, status: 'rejected' } }));
    return;
  }
  // Accept bid
  if (!auctions[auctionId]) auctions[auctionId] = { bids: [] };
  auctions[auctionId].bids.unshift({ ...bid, status: 'accepted' });
  await redis.publish('auction', JSON.stringify({ type: 'bid_accepted', payload: { auctionId, bidId: bid.id, status: 'accepted', bid } }));
}, { connection: redis });

// Subscribe to auction events and broadcast
const sub = new Redis(process.env.REDIS_URL);
sub.subscribe('auction');
sub.on('message', (channel, message) => {
  if (channel === 'auction' && global._wss) {
    broadcast(global._wss, JSON.parse(message));
  }
});

export function handleAuctionWS(ws, wss) {
  global._wss = wss;
  ws.on('message', async (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === 'new_bid') {
        const { auctionId, bid } = data.payload;
        
        // Process bid
        const ok = await consensusSimulate(bid);
        if (!ok) {
          // Bid rejected
          broadcast(wss, { 
            type: 'bid_rejected', 
            payload: { 
              auctionId, 
              bidId: bid.id, 
              status: 'rejected' 
            } 
          });
          return;
        }

        // Accept bid
        if (!auctions[auctionId]) auctions[auctionId] = { bids: [] };
        auctions[auctionId].bids.unshift({ ...bid, status: 'accepted' });
        
        // Broadcast accepted bid
        broadcast(wss, { 
          type: 'bid_accepted', 
          payload: { 
            auctionId, 
            bidId: bid.id, 
            status: 'accepted', 
            bid 
          } 
        });
      }
      // Add more message types as needed
    } catch (e) {
      ws.send(JSON.stringify({ type: 'error', message: e.message }));
    }
  });
  ws.send(JSON.stringify({ type: 'connected' }));
} 