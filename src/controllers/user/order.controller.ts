import type { Response } from "express";
import { PrismaClient, OrderStatus } from "@prisma/client";
import type { AuthRequest } from "../../middleware/auth.middleware";
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
  // Updated initiate payment method with shipping and commission
  public async initiatePayment(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    try {
      const userId = req.user?.userId;
      // Fetch cart items with product details
      const cart = await prisma.cart.findUnique({
        where: { userId: userId! },
        include: {
          items: {
            include: {
              product: {
                include: {
                  supplier: true,
                },
              },
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      // we can do this later -right now i am doing this as 50 rs -as per distance we can calculate
      const shippingCharge = 50; // Fixed shipping charge of ₹50

      // Calculate the total amount and commission
      let productTotal = 0;
      let totalCommission = 0;

      const orderItemsData = cart.items.map((item) => {
        const itemPrice = parseFloat(item.product.price.toString());
        const itemTotal = itemPrice * item.quantity;
        productTotal += itemTotal;

        // Calculate commission for this item
        const commissionRate = item.product.supplier.commissionRate || 10;
        const itemCommission = (itemTotal * commissionRate) / 100;
        totalCommission += itemCommission;

        return {
          productId: item.productId,
          supplierId: item.product.supplierId,
          quantity: item.quantity,
          price: item.product.price,
          size: item.size,
          commission: itemCommission,
        };
      });

      // Total amount including shipping
      const total = productTotal + shippingCharge;

      // Create a Razorpay order (amount must be provided in paise)
      const razorpayOrder = await razorpayInstance.orders.create({
        amount: Math.round(total * 100),
        currency: "INR",
        receipt: `receipt_order_${new Date().getTime()}`,
      });

      // Create an order record in the database
      const order = await prisma.order.create({
        data: {
          userId: userId!,
          total,
          shippingCharge,
          platformCommission: totalCommission,
          paymentIntent: razorpayOrder.id,
          status: OrderStatus.PENDING,
          deliveredAt: null,
          cancellationReason: null,
          trackingNumber: null,
          carrier: null,
          shippedAt: null,
        },
      });

      // Create order items for each cart item
      const orderItems = orderItemsData.map((item) => ({
        ...item,
        orderId: order.id,
      }));

      await prisma.orderItem.createMany({
        data: orderItems,
      });

      // Return the Razorpay order details along with our order id to the client
      return res.json({
        message: "Payment initiated",
        razorpayOrder,
        orderId: order.id,
      });
    } catch (error) {
      console.error("Initiate payment error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Updated verify payment to handle supplier payouts
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
        include: { items: true },
      });

      // Update supplier statistics
      for (const item of updatedOrder.items) {
        const itemTotal = parseFloat(item.price.toString()) * item.quantity;
        const commission = parseFloat(item.commission.toString());

        // Update supplier's sales and pending payout
        await prisma.supplier.update({
          where: { id: item.supplierId },
          data: {
            totalSales: { increment: itemTotal },
            totalCommission: { increment: commission },
            pendingPayout: { increment: itemTotal - commission },
          },
        });
      }

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
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  price: true,
                  images: true,
                  aesthetic: true,
                  category: true,
                  size: true,
                  inStock: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.json({
        success: true,
        orders: orders.map((order) => ({
          id: order.id,
          status: order.status,
          total: order.total,
          paymentIntent: order.paymentIntent,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          items: order.items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            size: item.size,
            priceAtPurchase: item.price,
            product: item.product,
          })),
        })),
      });
    } catch (error) {
      console.error("Get orders error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Cancel an order
  public async cancelOrder(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const orderId = req.params.id;
      const userId = req.user?.userId;
      const { reason } = req.body;

      // Check if order exists and belongs to user
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          userId: userId!,
          status: { in: ["PENDING", "PAID"] }, // Can only cancel if not shipped yet
        },
      });

      if (!order) {
        return res.status(404).json({
          message: "Order not found or not eligible for cancellation",
        });
      }

      // If order was paid, initiate refund through Razorpay
      if (order.status === "PAID" && order.paymentIntent) {
        try {
          // i will add razoroay logic later -need to discuss here

          console.log("Refund would be initiated for order:", orderId);
        } catch (refundError) {
          console.error("Refund error:", refundError);
        }
      }

      // Update order status
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          cancellationReason: reason || "User requested cancellation",
        },
      });

      // Restore product stock
      const orderItems = await prisma.orderItem.findMany({
        where: { orderId },
        include: { product: true },
      });

      for (const item of orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              increment: item.quantity,
            },
          },
        });
      }

      return res.json({
        message: "Order cancelled successfully",
        order: updatedOrder,
      });
    } catch (error) {
      console.error("Cancel order error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Get order details
  public async getOrderDetails(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    try {
      const orderId = req.params.id;
      const userId = req.user?.userId;

      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          userId: userId!,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      return res.json({ order });
    } catch (error) {
      console.error("Get order details error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
