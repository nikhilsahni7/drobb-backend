import { Router } from "express";
import asyncHandler from "express-async-handler";
import { OrderController } from "../controllers/order.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
const orderController = new OrderController();

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

export default router;
