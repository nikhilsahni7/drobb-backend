import type { Response } from "express";
import { PrismaClient, OrderStatus } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth.middleware";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_SECRET!,
});

export class OrderController {
  // Initiate the payment:
  // - Calculate total amount from cart items.
  // - Create a Razorpay order.
  // - Create an order record in the database (with PENDING status).
  public async initiatePayment(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    try {
      const userId = req.user?.userId;
      // Fetch cart items with product details
      const cart = await prisma.cart.findUnique({
        where: { userId: userId! },
        include: { items: { include: { product: true } } },
      });

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      // Calculate the total amount in rupees
      let total = 0;
      cart.items.forEach((item) => {
        total += parseFloat(item.product.price.toString()) * item.quantity;
      });

      // Create a Razorpay order (amount must be provided in paise)
      const razorpayOrder = await razorpayInstance.orders.create({
        amount: Math.round(total * 100),
        currency: "INR",
        receipt: `receipt_order_${new Date().getTime()}`,
      });

      console.log(razorpayOrder);

      // Create an order record in the database
      const order = await prisma.order.create({
        data: {
          userId: userId!,
          total,
          paymentIntent: razorpayOrder.id,
          status: OrderStatus.PENDING,
        },
      });

      // Create order items for each cart item.
      const orderItemsData = cart.items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price,
        size: item.size,
      }));
      await prisma.orderItem.createMany({
        data: orderItemsData,
      });

      // Return the Razorpay order details along with our order id to the client.
      return res.json({
        message: "Payment initiated",
        razorpayOrder,
        orderId: order.id,
      });
    } catch (error) {
      console.error("Initiate payment error:", error);
      console.log(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Verify the Razorpay signature:
  // - Generate an HMAC signature using the Razorpay order id and payment id.
  // - Compare with the provided signature.
  // - If valid, mark the order as PAID and clear the user's cart.
  public async verifyPaymentSignature(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        orderId,
      } = req.body;

      if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature ||
        !orderId
      ) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Generate the signature using our key secret
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET!)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      // Compare the generated and provided signatures
      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ message: "Invalid payment signature" });
      }

      // Update the order status to PAID
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID },
      });

      // Clear user's cart after successful payment
      const userId = req.user?.userId;
      const cart = await prisma.cart.findUnique({ where: { userId: userId! } });
      if (cart) {
        await prisma.cartItem.deleteMany({
          where: { cartId: cart.id },
        });
      }

      return res.json({
        message: "Payment verified and order completed",
        order: updatedOrder,
      });
    } catch (error) {
      console.error("Verify payment signature error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  //  method to get past orders
  public async getOrders(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId;
      const orders = await prisma.order.findMany({
        where: {
          userId: userId!,
          status: OrderStatus.PAID,
        },
        include: {
          items: { include: { product: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return res.json({ orders });
    } catch (error) {
      console.error("Get orders error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
