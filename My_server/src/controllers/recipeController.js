const recipeService = require("../services/recipeServices");

class RecipeController {
  // Lấy tất cả recipes
  async getAllRecipes(req, res) {
    try {
      const recipes = await recipeService.getAllRecipes();
      res.status(200).json(recipes);
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  // Lấy recipe theo ID
  async getRecipeById(req, res) {
    try {
      const recipe = await recipeService.getRecipeById(req.params.id);
      if (!recipe) {
        return res.status(404).json({
          status: "error",
          message: "Recipe not found",
        });
      }
      res.status(200).json(recipe);
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  // Tạo recipe mới
  async createRecipe(req, res) {
    try {
      const newRecipe = await recipeService.createRecipe(req.body);
      res.status(201).json({
        status: "success",
        data: newRecipe,
      });
    } catch (error) {
      res.status(400).json({
        status: "error",
        message: error.message,
      });
    }
  }

  // Cập nhật recipe
  async updateRecipe(req, res) {
    try {
      const recipe = await recipeService.updateRecipe(req.params.id, req.body);
      if (!recipe) {
        return res.status(404).json({
          status: "error",
          message: "Recipe not found",
        });
      }
      res.status(200).json({
        status: "success",
        data: recipe,
      });
    } catch (error) {
      res.status(400).json({
        status: "error",
        message: error.message,
      });
    }
  }

  // Xóa recipe
  async deleteRecipe(req, res) {
    try {
      const result = await recipeService.deleteRecipe(req.params.id);
      if (!result) {
        return res.status(404).json({
          status: "error",
          message: "Recipe not found",
        });
      }
      res.status(200).json({
        status: "success",
        message: "Recipe deleted successfully",
      });
    } catch (error) {
      res.status(400).json({
        status: "error",
        message: error.message,
      });
    }
  }
}

module.exports = new RecipeController();
