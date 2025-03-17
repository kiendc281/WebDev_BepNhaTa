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
  relatedRecipes: string[];
  tags: string[];
  likes: number;
  region: string;
  category: string;
  relatedInfo: Array<{
    title: string;
    link: string;
  }>;
}

export interface RecipeIngredient {
  name: string;
  amount: number;
  unit: string;
}

export interface RecipeStep {
  step: number;
  description: string;
  image?: string;
}
