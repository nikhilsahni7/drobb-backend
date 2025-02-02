import type { Response } from "express";
import { PrismaClient } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth.middleware";
import type { MatchStatus } from "@prisma/client";

const prisma = new PrismaClient();

export class MatchController {
  // Create or update a match
  public async matchWithProduct(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    try {
      const userId = req.user?.userId;
      const { productId, status } = req.body;

      if (!productId || !status) {
        return res
          .status(400)
          .json({ message: "Product ID and status are required" });
      }

      const match = await prisma.match.upsert({
        where: {
          userId_productId: {
            userId: userId!,
            productId,
          },
        },
        update: {
          status: status as MatchStatus,
        },
        create: {
          userId: userId!,
          productId,
          status: status as MatchStatus,
        },
      });

      return res.json({ match });
    } catch (error) {
      console.error("Product match error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Get user's match history
  public async getMatches(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId;
      const { status } = req.query;

      const matches = await prisma.match.findMany({
        where: {
          userId: userId!,
          ...(status && { status: status as MatchStatus }),
        },
        include: {
          product: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.json({ matches });
    } catch (error) {
      console.error("Get matches error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
