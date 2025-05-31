import { WebSocketMessage } from '../types';

// Message persistence using IndexedDB
class MessageStore {
  private static instance: MessageStore;
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'auctionDB';
  private readonly STORE_NAME = 'messages';

  private constructor() {
    this.initDB();
  }

  static getInstance(): MessageStore {
    if (!MessageStore.instance) {
      MessageStore.instance = new MessageStore();
    }
    return MessageStore.instance;
  }

  private initDB() {
    const request = indexedDB.open(this.DB_NAME, 1);

    request.onerror = (event) => {
      console.error('Error opening IndexedDB:', event);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(this.STORE_NAME)) {
        db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      this.db = (event.target as IDBOpenDBRequest).result;
    };
  }

  async storeMessage(auctionId: string, message: WebSocketMessage): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      const messageWithId = {
        id: `${auctionId}-${Date.now()}`,
        auctionId,
        message,
        timestamp: Date.now()
      };

      const request = store.add(messageWithId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getMessages(auctionId: string): Promise<WebSocketMessage[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const messages = request.result
          .filter((item: any) => item.auctionId === auctionId)
          .map((item: any) => item.message);
        resolve(messages);
      };

      request.onerror = () => reject(request.error);
    });
  }
}

// Simple in-memory queue implementation
class Queue {
  private items: any[] = [];
  private processing = false;

  async add(item: any): Promise<void> {
    this.items.push(item);
    if (!this.processing) {
      await this.process();
    }
  }

  private async process(): Promise<void> {
    if (this.items.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const item = this.items.shift();

    try {
      await this.processItem(item);
    } catch (error) {
      console.error('Error processing queue item:', error);
      // Put the item back at the front of the queue
      this.items.unshift(item);
    }

    // Process next item
    await this.process();
  }

  private async processItem(item: any): Promise<void> {
    // This will be implemented by the MessageQueueService
  }
}

// Message Queue Service
export class MessageQueueService {
  private static instance: MessageQueueService;
  private messageStore: MessageStore;
  private bidQueue: Queue;
  private notificationQueue: Queue;
  private auctionUpdateQueue: Queue;

  private constructor() {
    this.messageStore = MessageStore.getInstance();
    this.bidQueue = new Queue();
    this.notificationQueue = new Queue();
    this.auctionUpdateQueue = new Queue();
    this.initializeQueues();
  }

  static getInstance(): MessageQueueService {
    if (!MessageQueueService.instance) {
      MessageQueueService.instance = new MessageQueueService();
    }
    return MessageQueueService.instance;
  }

  private initializeQueues() {
    // Process bid queue
    this.bidQueue['processItem'] = async (item: any) => {
      const { auctionId, bid } = item;
      
      // Store the bid
      await this.messageStore.storeMessage(auctionId, {
        type: 'new_bid',
        payload: { auctionId, bid }
      });

      // Add to notification queue
      await this.notificationQueue.add({
        type: 'bid_accepted',
        payload: { auctionId, bid }
      });
    };

    // Process notification queue
    this.notificationQueue['processItem'] = async (message: WebSocketMessage) => {
      // Store the notification
      await this.messageStore.storeMessage('notifications', message);
      
      // Broadcast to all connected clients
      // This would be implemented in the WebSocket service
    };

    // Process auction update queue
    this.auctionUpdateQueue['processItem'] = async (item: any) => {
      const { auctionId, update } = item;
      await this.messageStore.storeMessage(auctionId, {
        type: 'auction_update',
        payload: { auctionId, update }
      });
    };
  }

  async addBid(auctionId: string, bid: any): Promise<void> {
    await this.bidQueue.add({ auctionId, bid });
  }

  async addNotification(message: WebSocketMessage): Promise<void> {
    await this.notificationQueue.add(message);
  }

  async addAuctionUpdate(auctionId: string, update: any): Promise<void> {
    await this.auctionUpdateQueue.add({ auctionId, update });
  }

  async getAuctionMessages(auctionId: string): Promise<WebSocketMessage[]> {
    return this.messageStore.getMessages(auctionId);
  }
}

export default MessageQueueService.getInstance(); 