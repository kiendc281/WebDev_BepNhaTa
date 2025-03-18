export interface Account {
    id?: string;
    _id?: string;
    name: string;
    email: string;
    phone: string;
    password?: string;
}

export interface LoginResponse {
    token: string;
    account: Account;
}

export interface AuthResponse {
    token: string;
    account: Account;
} 