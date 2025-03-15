import type { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import { AuthController } from "../../controllers/user/auth.controller";
import { Router } from "express";

const router = Router();
const authController = new AuthController();

router.post(
  "/signup",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await authController.signup(req, res);
  })
);

router.post(
  "/verify-otp",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await authController.verifyOTP(req, res);
  })
);

router.post(
  "/login",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await authController.login(req, res);
  })
);

// Admin creation endpoint
router.post(
  "/create-admin",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await authController.createAdmin(req, res);
  })
);

export default router;
