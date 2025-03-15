import type { Response } from "express";
import { PrismaClient, ReturnStatus, ReturnReason } from "@prisma/client";
import type { AuthRequest } from "../../middleware/auth.middleware";
import type { ReturnRequestInput } from "../../types/types";

const prisma = new PrismaClient();

export class ReturnController {
  // Request a return
  public async requestReturn(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    try {
      const userId = req.user?.userId;
      const { orderId, reason, description }: ReturnRequestInput = req.body;

      // Validate input
      if (!orderId || !reason) {
        return res
          .status(400)
          .json({ message: "Order ID and reason are required" });
      }

      // Check if order exists and belongs to user
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          userId: userId!,
          status: "PAID",
        },
      });

      if (!order) {
        return res
          .status(404)
          .json({ message: "Order not found or not eligible for return" });
      }

      // Check if return already exists
      const existingReturn = await prisma.return.findFirst({
        where: { orderId },
      });

      if (existingReturn) {
        return res
          .status(400)
          .json({ message: "Return request already exists for this order" });
      }

      // Determine if it's a faulty product claim
      const isFaulty =
        reason === ReturnReason.FAULTY_PRODUCT ||
        reason === ReturnReason.DAMAGED_PRODUCT;

      // Set return charge based on reason
      const returnCharge = isFaulty ? 20 : 10;

      // Create return request
      const returnRequest = await prisma.return.create({
        data: {
          orderId,
          userId: userId!,
          reason: reason as ReturnReason,
          description,
          isFaulty,
          returnCharge,
          status: ReturnStatus.PENDING,
        },
      });

      return res.status(201).json({
        message: "Return request submitted successfully",
        returnRequest,
        returnCharge,
      });
    } catch (error) {
      console.error("Request return error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Get user's return requests
  public async getUserReturns(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    try {
      const userId = req.user?.userId;

      const returns = await prisma.return.findMany({
        where: { userId: userId! },
        include: {
          order: {
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return res.json({ returns });
    } catch (error) {
      console.error("Get user returns error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
