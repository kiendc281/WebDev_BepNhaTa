export interface Product {
  _id: string;
  id?: string;
  ingredientName: string;
  title?: string;
  mainImage: string;
  image?: string;
  subImage: string;
  level: string;
  time: string;
  combo: string;
  discount: number;
  pricePerPortion: {
    [key: string]: number;
  };
  portionQuantities?: {
    [key: string]: number;
  };
  pricePerPortionArray?: Array<{
    portion: string;
    price: number;
    quantity?: number;
  }> | null;
  description: string;
  notes: string;
  components: string[];
  storage: string;
  expirationDate: string;
  tags: string[];
  relatedProductIds: string[];
  suggestedRecipeIds: string[];
  region: string;
  category: string;
  quantity: number;
  status: string;
  rating?: {
    rate: number;
    count: number;
  };
}
