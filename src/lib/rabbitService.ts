// lib/rabbitService.ts
import amqp from 'amqplib';

class RabbitService {
  private static instance: RabbitService;
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;

  private constructor() {}

  public static async getInstance(): Promise<RabbitService> {
    if (!RabbitService.instance) {
      RabbitService.instance = new RabbitService();
      await RabbitService.instance.init();
    }
    return RabbitService.instance;
  }

  private async init() {
    try {
      this.connection = await amqp.connect('amqp://localhost:15672');
      this.channel = await this.connection.createChannel();
      console.log('RabbitMQ connected');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      this.connection = null;
      this.channel = null;
    }
  }

  public async publish(queue: string, message: any) {
    if (!this.channel) {
      console.error('RabbitMQ channel not initialized');
      return;
    }

    try {
      await this.channel.assertQueue(queue, { durable: true });
      this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
        persistent: true,
      });
      console.log(`Message sent to ${queue}:`, message);
    } catch (error) {
      console.error('Error publishing message:', error);
    }
  }

  public async close() {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error);
    }
  }
}

export default RabbitService;
