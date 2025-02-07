import type { Response } from "express";
import { PrismaClient } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth.middleware";

const prisma = new PrismaClient();

export class CartController {
  // Add an item to the user's cart
  public async addToCart(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId;
      const { productId, quantity = 1, size } = req.body;

      if (!productId || !size) {
        return res
          .status(400)
          .json({ message: "Product ID and size are required" });
      }

      // Find or create the user's cart
      let cart = await prisma.cart.findUnique({ where: { userId: userId! } });
      if (!cart) {
        cart = await prisma.cart.create({ data: { userId: userId! } });
      }

      // Check if the same product (with the same size) is already in the cart
      const existingCartItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId,
          size,
        },
      });

      if (existingCartItem) {
        const updatedItem = await prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: { quantity: existingCartItem.quantity + Number(quantity) },
        });
        return res.json({ message: "Cart item updated", item: updatedItem });
      } else {
        const newItem = await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity: Number(quantity),
            size,
          },
        });
        return res.json({ message: "Item added to cart", item: newItem });
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Retrieve all cart items for the user (with product details)
  public async getCart(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId;
      const cart = await prisma.cart.findUnique({
        where: { userId: userId! },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      if (!cart) {
        return res.json({ items: [] });
      }

      return res.json({ items: cart.items });
    } catch (error) {
      console.error("Get cart error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Remove a cart item
  public async removeFromCart(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    try {
      const userId = req.user?.userId;
      const cartItemId = req.params.cartItemId;

      if (!cartItemId) {
        return res.status(400).json({ message: "Cart item id is required" });
      }

      // Fetch the cart item and include its associated cart to verify ownership
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: cartItemId },
        include: { cart: true },
      });

      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }

      if (cartItem.cart.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized action" });
      }

      const deletedItem = await prisma.cartItem.delete({
        where: { id: cartItemId },
      });

      return res.json({ message: "Cart item removed", item: deletedItem });
    } catch (error) {
      console.error("Remove from cart error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
