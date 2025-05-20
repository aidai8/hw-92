export interface ChatMessage {
    username: string;
    text: string;
}

export interface IncomingMessage {
    type: 'NEW_MESSAGE' | 'ONLINE_USERS' | 'INIT_MESSAGES';
    payload: ChatMessage | string[] | ChatMessage[];
}

export interface RegisterMutation {
    username: string;
    password: string;
}

export interface User {
    _id: string;
    username: string;
    token: string;
}

export interface ValidationError {
    errors: {
        [key: string]: {
            name: string;
            message: string;
        }
    },
    message: string;
    name: string;
    _message: string;
}

export interface LoginMutation {
    username: string;
    password: string;
}

export interface GlobalError {
    error: string;
}