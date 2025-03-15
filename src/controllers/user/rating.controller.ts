import type { Response } from "express";
import { PrismaClient } from "@prisma/client";
import type { AuthRequest } from "../../middleware/auth.middleware";

const prisma = new PrismaClient();

export class RatingController {
  public async submitRating(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    try {
      const userId = req.user?.userId;
      const { rating, categories, feedback } = req.body;

      // Validate input
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Invalid rating value" });
      }

      // Create rating
      const newRating = await prisma.rating.create({
        data: {
          userId: userId!,
          rating,
          categories,
          feedback,
        },
      });

      return res.status(201).json({
        message: "Rating submitted successfully",
        rating: newRating,
      });
    } catch (error) {
      console.error("Submit rating error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  public async getUserRatings(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    try {
      const userId = req.user?.userId;

      const ratings = await prisma.rating.findMany({
        where: { userId: userId! },
        orderBy: { createdAt: "desc" },
      });

      return res.json({ ratings });
    } catch (error) {
      console.error("Get user ratings error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
