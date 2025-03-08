const express = require('express');
const router = express.Router();
const RecipeController = require('../controllers/recipeController'); 

router.get('/recipes', RecipeController.getAllRecipes);
router.get('/recipes/:id', RecipeController.getRecipeById);
router.post('/recipes', RecipeController.createRecipe);
router.patch('/recipes/:id', RecipeController.updateRecipe);
router.delete('/recipes/:id', RecipeController.deleteRecipe);

module.exports = router;