const Recipe = require("../models/recipe");
const mongoose = require("mongoose");

class RecipeService {
  // Lấy tất cả recipes
  async getAllRecipes() {
    try {
      return await Recipe.find();
    } catch (error) {
      throw new Error("Không thể lấy danh sách công thức");
    }
  }

  // Lấy recipe theo ID
  async getRecipeById(id) {
    try {
      const recipe = await Recipe.findById(id);
      if (!recipe) {
        throw new Error("Không tìm thấy công thức");
      }
      return recipe;
    } catch (error) {
      throw new Error("Không tìm thấy công thức");
    }
  }

  // Tạo recipe mới
  async createRecipe(recipeData) {
    try {
      const recipe = new Recipe({
        _id: new mongoose.Types.ObjectId(),
        ...recipeData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const savedRecipe = await recipe.save();
      return savedRecipe;
    } catch (error) {
      throw new Error("Tạo công thức thất bại: " + error.message);
    }
  }

  // Cập nhật recipe
  async updateRecipe(id, updateData) {
    try {
      const recipe = await Recipe.findByIdAndUpdate(
        id,
        {
          ...updateData,
          updatedAt: Date.now(),
        },
        { new: true }
      );

      if (!recipe) {
        throw new Error("Không tìm thấy công thức");
      }

      return recipe;
    } catch (error) {
      throw new Error("Cập nhật thất bại: " + error.message);
    }
  }

  // Xóa recipe
  async deleteRecipe(id) {
    try {
      const recipe = await Recipe.findByIdAndDelete(id);
      if (!recipe) {
        throw new Error("Không tìm thấy công thức");
      }
      return recipe;
    } catch (error) {
      throw new Error("Xóa thất bại: " + error.message);
    }
  }
}

module.exports = new RecipeService();
