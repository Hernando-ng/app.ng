import Pusher from 'pusher';

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || 'dummy-app-id',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || 'dummy-key',
  secret: process.env.PUSHER_SECRET || 'dummy-secret',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
  useTLS: true,
});

export async function triggerRealtimeEvent(channel: string, event: string, data: any) {
  try {
    if (process.env.NODE_ENV !== 'test' && process.env.PUSHER_APP_ID) {
      await pusherServer.trigger(channel, event, data);
    }
  } catch (error) {
    console.error('Pusher trigger error:', error);
  }
}
