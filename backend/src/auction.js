// In-memory auction state with sample data
export const auctions = {
  "auction1": {
    id: "auction1",
    title: "Vintage Watch",
    description: "A beautiful vintage watch from 1950",
    startingPrice: 1000,
    currentPrice: 1200,
    bids: [
      { id: "bid1", amount: 1200, userId: "user1", timestamp: new Date().toISOString(), status: "accepted" },
      { id: "bid2", amount: 1100, userId: "user2", timestamp: new Date().toISOString(), status: "accepted" }
    ]
  },
  "auction2": {
    id: "auction2",
    title: "Antique Vase",
    description: "Ming Dynasty vase in excellent condition",
    startingPrice: 5000,
    currentPrice: 5500,
    bids: [
      { id: "bid3", amount: 5500, userId: "user3", timestamp: new Date().toISOString(), status: "accepted" }
    ]
  }
};

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
  const acceptors = 3;
  let accepted = 0;
  for (let i = 0; i < acceptors; i++) {
    if (Math.random() > 0.2) accepted++;
  }
  return accepted > acceptors / 2;
}

export function handleAuctionWS(ws, wss) {
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
        
        // Update current price
        if (bid.amount > auctions[auctionId].currentPrice) {
          auctions[auctionId].currentPrice = bid.amount;
        }
        
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
    } catch (e) {
      ws.send(JSON.stringify({ type: 'error', message: e.message }));
    }
  });
  ws.send(JSON.stringify({ type: 'connected' }));
} 