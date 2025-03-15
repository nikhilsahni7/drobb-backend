import { Router } from "express";
import asyncHandler from "express-async-handler";
import { AdminController } from "../../controllers/admin/admin.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();
const adminController = new AdminController();

router.use(authMiddleware);

// Get admin dashboard data
router.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    await adminController.getDashboard(req, res);
  })
);

// Get all suppliers
router.get(
  "/suppliers",
  asyncHandler(async (req, res) => {
    await adminController.getSuppliers(req, res);
  })
);

// Get supplier details
router.get(
  "/suppliers/:supplierId",
  asyncHandler(async (req, res) => {
    await adminController.getSupplierDetails(req, res);
  })
);

// Approve a supplier
router.patch(
  "/suppliers/:supplierId/approve",
  asyncHandler(async (req, res) => {
    await adminController.approveSupplier(req, res);
  })
);

// Create a payout
router.post(
  "/payouts",
  asyncHandler(async (req, res) => {
    await adminController.createPayout(req, res);
  })
);

// Update payout status
router.patch(
  "/payouts/:payoutId/status",
  asyncHandler(async (req, res) => {
    await adminController.updatePayoutStatus(req, res);
  })
);

// Get all returns
router.get(
  "/returns",
  asyncHandler(async (req, res) => {
    await adminController.getReturns(req, res);
  })
);

export default router;
