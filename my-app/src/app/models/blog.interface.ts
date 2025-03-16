export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  category: {
    name: string;
    slug: string;
  };
  author: string;
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

export interface BlogSection {
  order: number;
  _id?: string;
  content: BlogSectionContent;
}

export interface BlogSectionContent {
  type?: string; // 'text', 'image', etc.
  text?: string; // For text content (HTML)
  url?: string; // For image or media URLs
  caption?: string; // For image captions
  [key: string]: any; // Allow for other properties
}
