export interface NeverConnected {
    type: 'neverConnected';
    message: 'initializing...';
}

export const neverConnected: NeverConnected = {
    type: 'neverConnected',
    message: 'initializing...',
};

export interface Connected {
    type: 'connected';
    message: 'connected';
}

export const connected: Connected = {
    type: 'connected',
    message: 'connected',
};

export interface Disconnected {
    type: 'disConnected';
    message: 'disconnected';
    error: Error | undefined;
}

export const disConnected: Disconnected = {
    type: 'disConnected',
    message: 'disconnected',
    error: undefined,
};

export type ConnectionType = 'connected' | 'disConnected' | 'neverConnected';
export type Connection = NeverConnected | Connected | Disconnected;

export const connectionSet: { [key in ConnectionType]: Connection } = {
    neverConnected,
    connected,
    disConnected,
};
