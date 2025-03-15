import { Router } from "express";
import asyncHandler from "express-async-handler";
import { SupplierController } from "../../controllers/supplier/supplier.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();
const supplierController = new SupplierController();

router.use(authMiddleware);

// Get supplier dashboard
router.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    await supplierController.getDashboard(req, res);
  })
);

// Add a product
router.post(
  "/products",
  asyncHandler(async (req, res) => {
    await supplierController.addProduct(req, res);
  })
);

// Update a product
router.put(
  "/products/:productId",
  asyncHandler(async (req, res) => {
    await supplierController.updateProduct(req, res);
  })
);

// Get supplier products
router.get(
  "/products",
  asyncHandler(async (req, res) => {
    await supplierController.getProducts(req, res);
  })
);

// Get supplier orders
router.get(
  "/orders",
  asyncHandler(async (req, res) => {
    await supplierController.getOrders(req, res);
  })
);

// Mark order as shipped
router.patch(
  "/orders/:id/ship",
  asyncHandler(async (req, res) => {
    await supplierController.shipOrder(req, res);
  })
);

// Mark order as delivered
router.patch(
  "/orders/:id/deliver",
  asyncHandler(async (req, res) => {
    await supplierController.deliverOrder(req, res);
  })
);

// Get supplier returns
router.get(
  "/returns",
  asyncHandler(async (req, res) => {
    await supplierController.getReturns(req, res);
  })
);

// Verify a return
router.post(
  "/returns/:returnId/verify",
  asyncHandler(async (req, res) => {
    await supplierController.verifyReturn(req, res);
  })
);

// Get supplier payouts
router.get(
  "/payouts",
  asyncHandler(async (req, res) => {
    await supplierController.getPayouts(req, res);
  })
);

export default router;
