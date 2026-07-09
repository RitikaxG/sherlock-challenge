export type ConnectionId = string;

export type ConnectionRegistry<TConnection = unknown> = {
  readonly add: (connectionId: ConnectionId, connection: TConnection) => void;
  readonly remove: (connectionId: ConnectionId) => void;
  readonly get: (connectionId: ConnectionId) => TConnection | undefined;
};
