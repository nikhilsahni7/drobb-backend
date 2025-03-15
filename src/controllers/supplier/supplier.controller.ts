import type { Response } from "express";
import { PrismaClient } from "@prisma/client";
import type { AuthRequest } from "../../middleware/auth.middleware";
import type { SupplierProductInput } from "../../types/types";

const prisma = new PrismaClient();

export class SupplierController {
  // Get supplier dashboard data
  public async getDashboard(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    try {
      const userId = req.user?.userId;

      // Get supplier data
      const supplier = await prisma.supplier.findUnique({
        where: { userId: userId! },
        include: {
          products: {
            select: {
              id: true,
              name: true,
              price: true,
              inStock: true,
            },
          },
        },
      });

      if (!supplier) {
        return res.status(404).json({ message: "Supplier profile not found" });
      }

      // Get recent orders
      const recentOrders = await prisma.orderItem.findMany({
        where: {
          supplierId: supplier.id,
          order: {
            status: "PAID",
          },
        },
        include: {
          order: true,
          product: true,
        },
        orderBy: {
          order: {
            createdAt: "desc",
          },
        },
        take: 10,
      });

      // Get pending returns
      const pendingReturns = await prisma.return.findMany({
        where: {
          order: {
            items: {
              some: {
                supplierId: supplier.id,
              },
            },
          },
          status: {
            in: ["PENDING", "APPROVED"],
          },
        },
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
        orderBy: {
          createdAt: "desc",
        },
      });

      // Get pending payouts
      const pendingPayouts = await prisma.payout.findMany({
        where: {
          supplierId: supplier.id,
          status: "PENDING",
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.json({
        supplier,
        stats: {
          totalSales: supplier.totalSales,
          totalCommission: supplier.totalCommission,
          pendingPayout: supplier.pendingPayout,
          productCount: supplier.products.length,
          pendingReturnsCount: pendingReturns.length,
        },
        recentOrders,
        pendingReturns,
        pendingPayouts,
      });
    } catch (error) {
      console.error("Get supplier dashboard error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Add a new product
  public async addProduct(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId;
      const productData: SupplierProductInput = req.body;

      // Get supplier
      const supplier = await prisma.supplier.findUnique({
        where: { userId: userId! },
      });

      if (!supplier) {
        return res.status(404).json({ message: "Supplier profile not found" });
      }

      if (!supplier.approved) {
        return res
          .status(403)
          .json({ message: "Your supplier account is not approved yet" });
      }

      // Create product
      const product = await prisma.product.create({
        data: {
          ...productData,
          supplierId: supplier.id,
        },
      });

      return res.status(201).json({
        message: "Product added successfully",
        product,
      });
    } catch (error) {
      console.error("Add product error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Update a product
  public async updateProduct(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    try {
      const userId = req.user?.userId;
      const { productId } = req.params;
      const productData: Partial<SupplierProductInput> = req.body;

      // Get supplier
      const supplier = await prisma.supplier.findUnique({
        where: { userId: userId! },
      });

      if (!supplier) {
        return res.status(404).json({ message: "Supplier profile not found" });
      }

      // Check if product exists and belongs to this supplier
      const existingProduct = await prisma.product.findFirst({
        where: {
          id: productId,
          supplierId: supplier.id,
        },
      });

      if (!existingProduct) {
        return res.status(404).json({
          message:
            "Product not found or you don't have permission to update it",
        });
      }

      // Update product
      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: productData,
      });

      return res.json({
        message: "Product updated successfully",
        product: updatedProduct,
      });
    } catch (error) {
      console.error("Update product error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Get supplier products
  public async getProducts(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId;

      // Get supplier
      const supplier = await prisma.supplier.findUnique({
        where: { userId: userId! },
      });

      if (!supplier) {
        return res.status(404).json({ message: "Supplier profile not found" });
      }

      // Get products
      const products = await prisma.product.findMany({
        where: { supplierId: supplier.id },
        orderBy: { createdAt: "desc" },
      });

      return res.json({ products });
    } catch (error) {
      console.error("Get supplier products error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Get supplier orders
  public async getOrders(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId;

      // Get supplier
      const supplier = await prisma.supplier.findUnique({
        where: { userId: userId! },
      });

      if (!supplier) {
        return res.status(404).json({ message: "Supplier profile not found" });
      }

      // Get orders
      const orderItems = await prisma.orderItem.findMany({
        where: { supplierId: supplier.id },
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

      // Group by order
      const orders = orderItems.reduce(
        (acc, item) => {
          const orderId = item.order.id;
          if (!acc[orderId]) {
            acc[orderId] = {
              order: item.order,
              items: [],
            };
          }
          acc[orderId].items.push({
            id: item.id,
            product: item.product,
            quantity: item.quantity,
            price: item.price,
            commission: item.commission,
            size: item.size,
          });
          return acc;
        },
        {} as Record<string, any>
      );

      return res.json({
        orders: Object.values(orders),
      });
    } catch (error) {
      console.error("Get supplier orders error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Get supplier returns
  public async getReturns(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId;

      // Get supplier
      const supplier = await prisma.supplier.findUnique({
        where: { userId: userId! },
      });

      if (!supplier) {
        return res.status(404).json({ message: "Supplier profile not found" });
      }

      // Get returns related to this supplier's products
      const returns = await prisma.return.findMany({
        where: {
          order: {
            items: {
              some: {
                supplierId: supplier.id,
              },
            },
          },
        },
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
      console.error("Get supplier returns error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Ship an order
  public async shipOrder(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const orderId = req.params.id;
      const userId = req.user?.userId;
      const { trackingNumber, carrier } = req.body;

      // Get supplier ID
      const supplier = await prisma.supplier.findUnique({
        where: { userId: userId! },
      });

      if (!supplier) {
        return res.status(404).json({ message: "Supplier profile not found" });
      }

      // Check if order exists and contains supplier's products
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          status: "PAID",
          items: {
            some: {
              supplierId: supplier.id,
            },
          },
        },
      });

      if (!order) {
        return res
          .status(404)
          .json({ message: "Order not found or not eligible for shipping" });
      }

      // Update order status
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "SHIPPED",
          trackingNumber,
          carrier,
          shippedAt: new Date(),
        },
      });

      return res.json({
        message: "Order marked as shipped",
        order: updatedOrder,
      });
    } catch (error) {
      console.error("Ship order error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Mark order as delivered
  public async deliverOrder(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    try {
      const orderId = req.params.id;
      const userId = req.user?.userId;

      // Get supplier ID
      const supplier = await prisma.supplier.findUnique({
        where: { userId: userId! },
      });

      if (!supplier) {
        return res.status(404).json({ message: "Supplier profile not found" });
      }

      // Check if order exists and contains supplier's products
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          status: "SHIPPED",
          items: {
            some: {
              supplierId: supplier.id,
            },
          },
        },
        include: {
          items: true,
        },
      });

      if (!order) {
        return res
          .status(404)
          .json({ message: "Order not found or not eligible for delivery" });
      }

      // Update order status
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "DELIVERED",
          deliveredAt: new Date(),
        },
      });

      // Calculate supplier amount for this order
      const supplierItems = order.items.filter(
        (item) => item.supplierId === supplier.id
      );
      const supplierAmount = supplierItems.reduce((total, item) => {
        return (
          total +
          parseFloat(item.price.toString()) -
          parseFloat(item.commission.toString())
        );
      }, 0);

      // Update supplier's pending payout
      await prisma.supplier.update({
        where: { id: supplier.id },
        data: {
          pendingPayout: {
            increment: supplierAmount,
          },
        },
      });

      return res.json({
        message: "Order marked as delivered",
        order: updatedOrder,
      });
    } catch (error) {
      console.error("Deliver order error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Verify a return
  public async verifyReturn(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    try {
      const returnId = req.params.returnId;
      const { isFaulty } = req.body;
      const userId = req.user?.userId;

      // Get supplier ID
      const supplier = await prisma.supplier.findUnique({
        where: { userId: userId! },
      });

      if (!supplier) {
        return res.status(404).json({ message: "Supplier profile not found" });
      }

      // Get return request and check if it's for this supplier's product
      const returnRequest = await prisma.return.findFirst({
        where: {
          id: returnId,
          order: {
            items: {
              some: {
                supplierId: supplier.id,
              },
            },
          },
        },
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
      });

      if (!returnRequest) {
        return res.status(404).json({ message: "Return request not found" });
      }

      // Find the relevant order item
      const orderItem = returnRequest.order.items.find(
        (item) => item.supplierId === supplier.id
      );

      if (!orderItem) {
        return res
          .status(400)
          .json({ message: "No items from this supplier in the order" });
      }

      // Calculate refund amount based on fault verification
      const returnCharge = returnRequest.returnCharge || 0;
      const refundAmount = isFaulty
        ? parseFloat(orderItem.price.toString())
        : parseFloat(orderItem.price.toString()) -
          parseFloat(returnCharge.toString());

      // Update return with verification result
      const updatedReturn = await prisma.return.update({
        where: { id: returnId },
        data: {
          faultyVerified: isFaulty,
          status: isFaulty ? "APPROVED" : "REJECTED",
          refundAmount,
        },
      });

      return res.json({
        message: "Return verification completed",
        returnRequest: updatedReturn,
      });
    } catch (error) {
      console.error("Verify return error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Get supplier payouts
  public async getPayouts(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId;

      // Get supplier
      const supplier = await prisma.supplier.findUnique({
        where: { userId: userId! },
      });

      if (!supplier) {
        return res.status(404).json({ message: "Supplier profile not found" });
      }

      // Get payouts
      const payouts = await prisma.payout.findMany({
        where: { supplierId: supplier.id },
        orderBy: { createdAt: "desc" },
      });

      return res.json({
        payouts,
        pendingAmount: supplier.pendingPayout,
      });
    } catch (error) {
      console.error("Get supplier payouts error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
