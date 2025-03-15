import { Router } from "express";
import { ProductController } from "../../controllers/user/product.controller";
import asyncHandler from "express-async-handler";

const router = Router();
const productController = new ProductController();

// Get all products with filters
router.get(
  "/",
  asyncHandler(async (req, res) => {
    await productController.getProducts(req, res);
  })
);

// Get single product
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    await productController.getProduct(req, res);
  })
);

// Get all categories
router.get(
  "/categories/all",
  asyncHandler(async (req, res) => {
    await productController.getCategories(req, res);
  })
);

// Get all aesthetics
router.get(
  "/aesthetics/all",
  asyncHandler(async (req, res) => {
    await productController.getAesthetics(req, res);
  })
);

export default router;
