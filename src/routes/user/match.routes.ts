import { Router } from "express";
import { MatchController } from "../../controllers/user/match.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import asyncHandler from "express-async-handler";

const router = Router();
const matchController = new MatchController();

router.use(authMiddleware);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    await matchController.matchWithProduct(req, res);
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    await matchController.getMatches(req, res);
  })
);

export default router;
