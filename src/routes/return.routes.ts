import { Router } from "express";
import asyncHandler from "express-async-handler";
import { ReturnController } from "../controllers/return.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
const returnController = new ReturnController();

router.use(authMiddleware);

// Request a return
router.post(
  "/request",
  asyncHandler(async (req, res) => {
    await returnController.requestReturn(req, res);
  })
);

// Get user's return requests
router.get(
  "/",
  asyncHandler(async (req, res) => {
    await returnController.getUserReturns(req, res);
  })
);

export default router;
