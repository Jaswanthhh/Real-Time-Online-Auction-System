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
      
      switch (data.type) {
        case 'create_auction':
          const { auction } = data.payload;
          auctions[auction.id] = {
            ...auction,
            currentPrice: auction.startingPrice,
            bids: [],
            createdAt: new Date().toISOString()
          };
          broadcast(wss, {
            type: 'auction_created',
            payload: { auction: auctions[auction.id] }
          });
          break;

        case 'new_bid':
          const { auctionId, bid } = data.payload;
          
          // Check if auction exists
          if (!auctions[auctionId]) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Auction not found'
            }));
            return;
          }

          // Check if bid is higher than current price
          if (bid.amount <= auctions[auctionId].currentPrice) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Bid must be higher than current price'
            }));
            return;
          }

          // Process bid
          const ok = await consensusSimulate(bid);
          if (!ok) {
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
          auctions[auctionId].bids.unshift({
            ...bid,
            timestamp: new Date().toISOString(),
            status: 'accepted'
          });
          
          // Update current price
          auctions[auctionId].currentPrice = bid.amount;
          
          // Broadcast accepted bid
          broadcast(wss, {
            type: 'bid_accepted',
            payload: {
              auctionId,
              bidId: bid.id,
              status: 'accepted',
              bid: auctions[auctionId].bids[0]
            }
          });
          break;

        case 'get_auctions':
          ws.send(JSON.stringify({
            type: 'auctions_list',
            payload: { auctions }
          }));
          break;

        default:
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Unknown message type'
          }));
      }
    } catch (e) {
      ws.send(JSON.stringify({
        type: 'error',
        message: e.message
      }));
    }
  });

  // Send initial connection success message
  ws.send(JSON.stringify({
    type: 'connected',
    payload: { message: 'Connected to auction server' }
  }));
} 