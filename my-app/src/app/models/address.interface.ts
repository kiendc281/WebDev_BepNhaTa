export interface Address {
    _id?: string;
    accountId: string;
    recipientName: string;
    recipientPhone: string;
    city: string;
    district: string;
    ward: string;
    detail: string;
    isDefault: boolean;
    createdAt?: Date;
    updatedAt?: Date;
} 