export interface Account {
    _id: string;
    email: string;
    phone?: string;
    fullName: string;
    role: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface LoginResponse {
    token: string;
    account: Account;
}
