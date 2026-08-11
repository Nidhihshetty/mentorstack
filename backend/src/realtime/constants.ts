export const EXCHANGES = {
  direct: 'direct-exchange',
  discussions: 'discussions-exchange', // Topic exchange for community discussions
  chats: 'chats-exchange', // Topic exchange for mentor-mentee chats
} as const;

export const ROUTING_KEYS = {
  community: (communityId: number | string) => `community.${communityId}`,
  chatConnection: (connectionId: number | string) => `chat.connection.${connectionId}`,
} as const;

export const WS_PATHS = {
  discussions: '/ws/discussions',
  chat: '/ws/chat',
} as const;

export const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
