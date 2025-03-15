import { Router } from "express";
import asyncHandler from "express-async-handler";
import { OrderController } from "../controllers/order.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { PrismaClient } from "@prisma/client";

const router = Router();
const orderController = new OrderController();
const prisma = new PrismaClient();

router.use(authMiddleware);

// Initiate payment and create an order
router.post(
  "/initiate",
  asyncHandler(async (req, res) => {
    await orderController.initiatePayment(req, res);
  })
);

// Verify Razorpay signature and mark the order as paid
router.post(
  "/verify",
  asyncHandler(async (req, res) => {
    await orderController.verifyPaymentSignature(req, res);
  })
);

// Retrieve past orders
router.get(
  "/",
  asyncHandler(async (req, res) => {
    await orderController.getOrders(req, res);
  })
);

// Cancel an order
router.patch(
  "/:id/cancel",
  asyncHandler(async (req, res) => {
    await orderController.cancelOrder(req, res);
  })
);

// Get order details
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    await orderController.getOrderDetails(req, res);
  })
);

export default router;
