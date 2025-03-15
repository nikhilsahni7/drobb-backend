import type { Response } from "express";
import { PrismaClient, UserRole, PayoutStatus } from "@prisma/client";
import type { AuthRequest } from "../../middleware/auth.middleware";
import type { AdminPayoutInput } from "../../types/types";

const prisma = new PrismaClient();

export class AdminController {
  // Get admin dashboard data
  public async getDashboard(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    try {
      // Check if user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Get total revenue (commission)
      const totalCommission = await prisma.supplier.aggregate({
        _sum: {
          totalCommission: true,
        },
      });

      // Get order counts
      const orderCounts = await prisma.order.groupBy({
        by: ["status"],
        _count: {
          id: true,
        },
      });

      // Get supplier count
      const supplierCount = await prisma.supplier.count();
      const pendingApprovalCount = await prisma.supplier.count({
        where: { approved: false },
      });

      // Get return stats
      const returnCounts = await prisma.return.groupBy({
        by: ["status"],
        _count: {
          id: true,
        },
      });

      // Get pending payouts
      const pendingPayouts = await prisma.payout.aggregate({
        where: { status: PayoutStatus.PENDING },
        _sum: {
          amount: true,
        },
      });

      return res.json({
        revenue: totalCommission._sum.totalCommission || 0,
        orders: {
          total: orderCounts.reduce((sum, item) => sum + item._count.id, 0),
          byStatus: orderCounts.reduce(
            (acc, item) => {
              acc[item.status] = item._count.id;
              return acc;
            },
            {} as Record<string, number>
          ),
        },
        suppliers: {
          total: supplierCount,
          pendingApproval: pendingApprovalCount,
        },
        returns: {
          total: returnCounts.reduce((sum, item) => sum + item._count.id, 0),
          byStatus: returnCounts.reduce(
            (acc, item) => {
              acc[item.status] = item._count.id;
              return acc;
            },
            {} as Record<string, number>
          ),
        },
        pendingPayouts: pendingPayouts._sum.amount || 0,
      });
    } catch (error) {
      console.error("Get admin dashboard error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Get all suppliers
  public async getSuppliers(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    try {
      // Check if user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const suppliers = await prisma.supplier.findMany({
        include: {
          user: {
            select: {
              email: true,
              profile: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.json({ suppliers });
    } catch (error) {
      console.error("Get suppliers error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Approve a supplier
  public async approveSupplier(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    try {
      // Check if user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { supplierId } = req.params;

      const supplier = await prisma.supplier.update({
        where: { id: supplierId },
        data: { approved: true },
      });

      return res.json({
        message: "Supplier approved successfully",
        supplier,
      });
    } catch (error) {
      console.error("Approve supplier error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Get supplier details
  public async getSupplierDetails(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    try {
      // Check if user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { supplierId } = req.params;

      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
        include: {
          user: {
            select: {
              email: true,
              profile: true,
            },
          },
          products: true,
        },
      });

      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      // Get supplier's orders
      const orders = await prisma.orderItem.findMany({
        where: { supplierId },
        include: {
          order: true,
          product: true,
        },
        orderBy: {
          order: {
            createdAt: "desc",
          },
        },
      });

      // Get supplier's returns
      const returns = await prisma.return.findMany({
        where: {
          order: {
            items: {
              some: {
                supplierId,
              },
            },
          },
        },
        include: {
          order: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Get supplier's payouts
      const payouts = await prisma.payout.findMany({
        where: { supplierId },
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.json({
        supplier,
        orders,
        returns,
        payouts,
      });
    } catch (error) {
      console.error("Get supplier details error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Create a payout for a supplier
  public async createPayout(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    try {
      // Check if user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { supplierId, amount, description }: AdminPayoutInput = req.body;

      // Check if supplier exists
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
      });

      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      // Check if amount is valid
      if (amount <= 0) {
        return res
          .status(400)
          .json({ message: "Amount must be greater than 0" });
      }

      // Check if supplier has enough pending payout
      if (parseFloat(supplier.pendingPayout.toString()) < amount) {
        return res
          .status(400)
          .json({ message: "Insufficient pending payout amount" });
      }

      // Create payout
      const payout = await prisma.payout.create({
        data: {
          supplierId,
          amount,
          description,
          status: PayoutStatus.PENDING,
        },
      });

      // Update supplier's pending payout
      await prisma.supplier.update({
        where: { id: supplierId },
        data: {
          pendingPayout: {
            decrement: amount,
          },
          lastPayoutDate: new Date(),
        },
      });

      return res.status(201).json({
        message: "Payout created successfully",
        payout,
      });
    } catch (error) {
      console.error("Create payout error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Update payout status
  public async updatePayoutStatus(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    try {
      // Check if user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { payoutId } = req.params;
      const { status } = req.body;

      if (!["PENDING", "COMPLETED", "FAILED"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const payout = await prisma.payout.update({
        where: { id: payoutId },
        data: { status: status as PayoutStatus },
      });

      return res.json({
        message: "Payout status updated successfully",
        payout,
      });
    } catch (error) {
      console.error("Update payout status error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Get all returns
  public async getReturns(req: AuthRequest, res: Response): Promise<Response> {
    try {
      // Check if user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { status } = req.query;

      const where: any = {};
      if (status) {
        where.status = status;
      }

      const returns = await prisma.return.findMany({
        where,
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
          user: {
            select: {
              email: true,
              profile: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.json({ returns });
    } catch (error) {
      console.error("Get returns error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
