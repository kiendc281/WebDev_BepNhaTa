export interface Account {
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