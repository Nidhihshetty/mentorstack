import { getRabbitChannel } from './rabbit';
import { EXCHANGES } from './constants';

export async function ensureChatTopology(): Promise<void> {
  const ch = await getRabbitChannel();
  // Topic exchange for chat messages
  await ch.assertExchange(EXCHANGES.chats, 'topic', { durable: true });
}
