export interface Admin {
  _id: string;
  email: string;
  password: string;
  name: string;
  phone: string;
  birthOfDate: string;
  gender: 'male' | 'female';
  role: string;
  createdAt?: string;
}
