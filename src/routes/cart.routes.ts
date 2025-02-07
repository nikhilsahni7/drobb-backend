import { Router } from "express";
import asyncHandler from "express-async-handler";
import { CartController } from "../controllers/cart.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
const cartController = new CartController();

router.use(authMiddleware);

// Endpoint to add an item to the cart.
router.post(
  "/add",
  asyncHandler(async (req, res) => {
    await cartController.addToCart(req, res);
  })
);

// Endpoint to get all cart items.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    await cartController.getCart(req, res);
  })
);

// Endpoint to remove a cart item.
router.delete(
  "/remove/:cartItemId",
  asyncHandler(async (req, res) => {
    await cartController.removeFromCart(req, res);
  })
);

export default router;
