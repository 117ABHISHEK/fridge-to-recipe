export interface RecipeIngredient {
  name: string;
  amount: number;       
  unit: string;          
  swaps: string[];
}

export interface RecipeStep {
  id: string;
  text: string;
}

export interface Recipe {
  id: string;             
  recipeName: string;
  description: string;
  baseServings: number;
  caloriesPerServing: number;
  prepTime: string;
  cookTime: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

export interface RecipeResponse {
  recipes: Recipe[];     
}