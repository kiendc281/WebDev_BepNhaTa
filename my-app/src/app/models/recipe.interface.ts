export interface Recipe {
  _id: string;
  recipeName: string;
  recipeImage: string;
  servingsOptions: {
    [key: string]: {
      ingredients: {
        name: string;
        amount: number;
        unit: string;
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
  tips: string[];
  relatedRecipes: string[];
  tags: string[];
  likes: number;
  region: string;
  category: string;
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
