import * as amqp from 'amqplib';
import { EXCHANGES, RABBITMQ_URL } from './constants';

// Using loose typings here due to variations between amqplib and @types/amqplib across versions
let connection: any = null;
let channel: any = null;

export async function getRabbitChannel(): Promise<any> {
  if (channel) return channel;
  connection = await amqp.connect(RABBITMQ_URL);
  const ch: any = await (connection as any).createChannel();
  // Ensure exchanges exist
  await ch.assertExchange(EXCHANGES.direct, 'direct', { durable: true });
  await ch.assertExchange(EXCHANGES.discussions, 'topic', { durable: true });
  channel = ch;
  return ch;
}

export async function closeRabbit(): Promise<void> {
  try {
    await channel?.close();
    if (connection && typeof (connection as any).close === 'function') {
      await (connection as any).close();
    }
  } catch {}
  channel = null;
  connection = null;
}

export type PublishOptions = {
  exchange: string;
  routingKey: string;
  message: any;
};

export async function publish({ exchange, routingKey, message }: PublishOptions) {
  const ch = await getRabbitChannel();
  const payload = Buffer.from(JSON.stringify(message));
  ch.publish(exchange, routingKey, payload, { contentType: 'application/json', persistent: false });
}

export async function createEphemeralConsumer(bindingKey: string, onMessage: (msg: any) => void) {
  const ch = await getRabbitChannel();
  const q = await ch.assertQueue('', { exclusive: true, durable: false, autoDelete: true });
  await ch.bindQueue(q.queue, EXCHANGES.discussions, bindingKey);
  const consumerTag = (await ch.consume(q.queue, (msg: amqp.ConsumeMessage | null) => {
    if (!msg) return;
    try {
      const content = JSON.parse(msg.content.toString());
      onMessage(content);
    } catch (e) {
      console.error('Failed to parse message', e);
    } finally {
      ch.ack(msg);
    }
  })).consumerTag;

  return {
    queue: q.queue,
    consumerTag,
    cancel: async () => {
      try { await ch.cancel(consumerTag); } catch {}
      try { await ch.unbindQueue(q.queue, EXCHANGES.discussions, bindingKey); } catch {}
      try { await ch.deleteQueue(q.queue); } catch {}
    }
  };
}

export async function createDirectEphemeralConsumer(bindingKey: string, onMessage: (msg: any) => void) {
  const ch = await getRabbitChannel();
  const q = await ch.assertQueue('', { exclusive: true, durable: false, autoDelete: true });
  await ch.bindQueue(q.queue, EXCHANGES.direct, bindingKey);
  const consumerTag = (await ch.consume(q.queue, (msg: amqp.ConsumeMessage | null) => {
    if (!msg) return;
    try {
      const content = JSON.parse(msg.content.toString());
      onMessage(content);
    } catch (e) {
      console.error('Failed to parse direct message', e);
    } finally {
      ch.ack(msg);
    }
  })).consumerTag;

  return {
    queue: q.queue,
    consumerTag,
    cancel: async () => {
      try { await ch.cancel(consumerTag); } catch {}
      try { await ch.unbindQueue(q.queue, EXCHANGES.direct, bindingKey); } catch {}
      try { await ch.deleteQueue(q.queue); } catch {}
    }
  };
}
