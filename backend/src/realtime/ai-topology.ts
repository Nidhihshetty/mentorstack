import { getRabbitChannel } from './rabbit';
import { EXCHANGES } from './constants';

// Ensure the durable queue for AI questions exists and is bound to the direct exchange
export async function ensureAiTopology() {
  const ch = await getRabbitChannel();
  await ch.assertExchange(EXCHANGES.direct, 'direct', { durable: true });
  await ch.assertQueue('user-questions-queue', { durable: true });
  await ch.bindQueue('user-questions-queue', EXCHANGES.direct, 'ai-question');
}
