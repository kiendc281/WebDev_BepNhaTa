export interface Blog {
  _id: string;
  category: {
    name?: string;
    _id?: string;
  };
  title: string;
  slug: string;
  author:
    | {
        _id: string;
        name?: string;
      }
    | string; // Author có thể là object hoặc string ID
  views: number;
  likes: number;
  likedBy: string[]; // Mảng các ID người dùng đã thích
  description: string;
  thumbnail: string;
  sections: any[]; // Mảng các phần trong blog
  publishDate: string;
  createdAt: string;
  updatedAt: string;
}
