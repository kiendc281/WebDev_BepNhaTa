export interface BlogPost {
  _id: string;
  originalId?: string; // ID gốc từ dữ liệu (BL01, BL02, ...)
  title: string;
  slug: string;
  category: {
    name: string;
    slug: string;
  };
  author: Author | null;
  views: number;
  likes: number;
  likedBy: string[];
  description: string;
  thumbnail: string;
  content?: string; // HTML content (sử dụng cho hiển thị trực tiếp)
  sections?: BlogSection[]; // Structured content (sử dụng cho hiển thị có cấu trúc)
  publishDate: string;
  createdAt: string;
  updatedAt: string;
  saved?: boolean; // Client-side property
}

export interface Author {
  _id: string;
  name: string;
  email: string;
}

export interface BlogSection {
  order: number;
  _id?: string;
  content: BlogSectionContent;
}

export interface BlogSectionContent {
  title?: string;
  text?: string[] | string;
  imageUrl?: string;
  imageCaption?: string;
  type?: string;
  url?: string;
  caption?: string;
  [key: string]: any;
}
