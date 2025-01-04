import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import amqp from 'amqplib';

class SocketService {
  private static instance: SocketService;
  private io: SocketIOServer | null = null;
  private channel: amqp.Channel | null = null; // Store the RabbitMQ channel
  private readonly RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost';
  private readonly EXCHANGE_NAME = 'campaign_exchange';
  private readonly QUEUE_NAME = 'campaigns_queue';
  private readonly ROUTING_KEY = 'campaigns';
  private rabbitMQConnected = false; // Track RabbitMQ connection status

  private constructor() {
    console.log('[SocketService] Initializing...');

    const httpServer = createServer();
    this.io = new SocketIOServer(httpServer, {
      path: '/api/socket/io',
      addTrailingSlash: false,
      cors: {
        origin: '*',
      },
    });

    // Start the HTTP server if it's not already listening
    if (!httpServer.listening) {
      httpServer.listen(3001);
      console.log('[SocketService] Socket.IO server started on port 3001');
    }

    this.io.on('connection', (socket) => {
      console.log(`[SocketService] Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`[SocketService] Client disconnected: ${socket.id}`);
      });
    });

    // Initialize RabbitMQ Consumer
    this.initializeRabbitMQ();
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public getIO(): SocketIOServer | null {
    return this.io;
  }

  public async emitEvent(event: string, data: any) {
    if (this.rabbitMQConnected && this.channel) {
      try {
        console.log(`[SocketService] Publishing event '${event}' to RabbitMQ`);
        this.channel.publish(
          this.EXCHANGE_NAME,
          this.ROUTING_KEY,
          Buffer.from(JSON.stringify({ event, data })),
          { persistent: true }
        );
        console.log(`[SocketService] Event '${event}' successfully published to RabbitMQ`);
      } catch (error) {
        console.error(`[SocketService] Failed to publish to RabbitMQ. Falling back to WebSocket. Error:`, error);
        this.emitDirectly(event, data);
      }
    } else {
      console.warn('[SocketService] RabbitMQ not connected. Emitting directly via WebSocket');
      this.emitDirectly(event, data);
    }
  }

  private emitDirectly(event: string, data: any) {
    if (this.io) {
      console.log(`[SocketService] Emitting event '${event}' directly via WebSocket with data:`, data);
      this.io.emit(event, data);
    } else {
      console.warn('[SocketService] Attempted to emit event directly, but Socket.IO instance is not initialized');
    }
  }

  private async initializeRabbitMQ() {
    console.log('[SocketService] Connecting to RabbitMQ...');
    try {
      const connection = await amqp.connect(this.RABBITMQ_URL);
      console.log('[SocketService] Connected to RabbitMQ');

      const channel = await connection.createChannel();
      this.channel = channel;
      this.rabbitMQConnected = true; // Update connection status
      console.log('[SocketService] RabbitMQ channel created');

      await channel.assertExchange(this.EXCHANGE_NAME, 'direct', { durable: true });
      console.log(`[SocketService] Exchange '${this.EXCHANGE_NAME}' asserted`);

      await channel.assertQueue(this.QUEUE_NAME, { durable: true });
      console.log(`[SocketService] Queue '${this.QUEUE_NAME}' asserted`);

      await channel.bindQueue(this.QUEUE_NAME, this.EXCHANGE_NAME, this.ROUTING_KEY);
      console.log(`[SocketService] Queue '${this.QUEUE_NAME}' bound to exchange '${this.EXCHANGE_NAME}' with routing key '${this.ROUTING_KEY}'`);

      console.log(`[SocketService] Listening for messages on queue '${this.QUEUE_NAME}'...`);

      channel.consume(
        this.QUEUE_NAME,
        (msg) => {
          if (msg) {
            const messageContent = JSON.parse(msg.content.toString());
            console.log('[SocketService] Received message from RabbitMQ:', messageContent);

            // Forward the message to all connected WebSocket clients
            this.emitDirectly(messageContent.event, messageContent.data);

            // Acknowledge the message
            channel.ack(msg);
            console.log('[SocketService] Message acknowledged');
          }
        },
        { noAck: false } // Ensure manual acknowledgment
      );

      // Handle connection close or errors
      connection.on('close', () => {
        console.warn('[SocketService] RabbitMQ connection closed');
        this.rabbitMQConnected = false;
        this.channel = null;
        this.retryRabbitMQConnection();
      });

      connection.on('error', (error) => {
        console.error('[SocketService] RabbitMQ connection error:', error);
        this.rabbitMQConnected = false;
        this.channel = null;
        this.retryRabbitMQConnection();
      });
    } catch (error) {
      console.error('[SocketService] Error initializing RabbitMQ:', error);
      this.rabbitMQConnected = false;
      this.retryRabbitMQConnection();
    }
  }

  private retryRabbitMQConnection() {
    console.log('[SocketService] Retrying RabbitMQ connection in 5 seconds...');
    setTimeout(() => this.initializeRabbitMQ(), 5000); // Retry after 5 seconds
  }
}

export default SocketService;
