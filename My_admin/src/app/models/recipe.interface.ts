export interface Recipe {
  _id: string;
  recipeName: string;
  recipeImage: string;
  servingsOptions: {
    [key: string]: {
      ingredients: {
        name: string;
        quantity: string;
      }[];
    };
  };
  time: string;
  difficulty: string;
  description: string;
  notes: string;
  preparation: string[];
  steps: string[];
  servingSuggestion: string;
  tips: string;
  relatedRecipeIds?: string[];
  suggestedIngredientIds?: string[];
  tags: string[];
  likes: number;
  region: string;
  category: string;
  relatedInfo?: Array<{
    title: string;
    link: string;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Ingredient {
  name: string;
  quantity: string;
}

export interface Step {
  description: string;
  image?: string;
}
