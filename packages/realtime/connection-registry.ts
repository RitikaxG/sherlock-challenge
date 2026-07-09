export type RealtimeClient = {
  send(data: string): void;
  close?: () => void;
};

export type MeetingConnectionRegistry = {
  subscribe(meetingId: string, client: RealtimeClient): () => void;
  unsubscribe(meetingId: string, client: RealtimeClient): void;
  getClients(meetingId: string): readonly RealtimeClient[];
  meetingCount(): number;
  clientCount(meetingId?: string): number;
};

export function createMeetingConnectionRegistry(): MeetingConnectionRegistry {
  const clientsByMeeting = new Map<string, Set<RealtimeClient>>();

  function unsubscribe(meetingId: string, client: RealtimeClient) {
    const clients = clientsByMeeting.get(meetingId);
    if (!clients) {
      return;
    }

    clients.delete(client);
    if (clients.size === 0) {
      clientsByMeeting.delete(meetingId);
    }
  }

  return {
    subscribe(meetingId, client) {
      const clients = clientsByMeeting.get(meetingId) ?? new Set<RealtimeClient>();
      clients.add(client);
      clientsByMeeting.set(meetingId, clients);

      return () => unsubscribe(meetingId, client);
    },
    unsubscribe,
    getClients(meetingId) {
      return [...(clientsByMeeting.get(meetingId) ?? [])];
    },
    meetingCount() {
      return clientsByMeeting.size;
    },
    clientCount(meetingId) {
      if (meetingId) {
        return clientsByMeeting.get(meetingId)?.size ?? 0;
      }

      return [...clientsByMeeting.values()].reduce(
        (total, clients) => total + clients.size,
        0
      );
    }
  };
}
