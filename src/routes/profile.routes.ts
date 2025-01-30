import { Router } from "express";
import { ProfileController } from "../controllers/profile.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import asyncHandler from "express-async-handler";
import type { AuthRequest } from "../middleware/auth.middleware";
import type { Response } from "express";

const router = Router();
const profileController = new ProfileController();

router.use(authMiddleware);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    await profileController.getProfile(req, res);
  })
);

router.put(
  "/update",
  asyncHandler(async (req, res) => {
    await profileController.updateProfile(req, res);
  })
);

router.put(
  "/preferences",
  asyncHandler(async (req, res) => {
    await profileController.updatePreferences(req, res);
  })
);

router.put(
  "/location",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await profileController.updateLocation(req, res);
  })
);

router.get(
  "/nearby",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await profileController.getNearbyUsers(req, res);
  })
);

export default router;
