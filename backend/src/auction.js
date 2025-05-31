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