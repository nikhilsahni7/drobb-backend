import { Router } from "express";
import asyncHandler from "express-async-handler";
import { RatingController } from "../../controllers/user/rating.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();
const ratingController = new RatingController();

router.use(authMiddleware);

// Submit a new rating
router.post(
  "/",
  asyncHandler(async (req, res) => {
    await ratingController.submitRating(req, res);
  })
);

// Get user's ratings
router.get(
  "/",
  asyncHandler(async (req, res) => {
    await ratingController.getUserRatings(req, res);
  })
);

export default router;
