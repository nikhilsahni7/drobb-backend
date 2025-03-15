import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import type { AestheticType } from "../../types/types";

const prisma = new PrismaClient();

export class ProductController {
  // Get all products with filters
  public async getProducts(req: Request, res: Response): Promise<Response> {
    try {
      const {
        category,
        aesthetic,
        minPrice,
        maxPrice,
        size,
        inStock,
        limit = 20,
        page = 1,
      } = req.query;

      // Build filter conditions
      const where: any = {};

      if (category) {
        where.category = category as string;
      }

      if (aesthetic) {
        where.aesthetic = {
          has: aesthetic as AestheticType,
        };
      }

      if (minPrice || maxPrice) {
        where.price = {
          ...(minPrice && { gte: parseFloat(minPrice as string) }),
          ...(maxPrice && { lte: parseFloat(maxPrice as string) }),
        };
      }

      if (size) {
        where.size = {
          has: size as string,
        };
      }

      if (inStock !== undefined) {
        where.inStock = inStock === "true";
      }

      // Get total count for pagination
      const total = await prisma.product.count({ where });

      // Get paginated products
      const products = await prisma.product.findMany({
        where,
        take: Number(limit),
        skip: (Number(page) - 1) * Number(limit),
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.json({
        products,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error("Get products error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Get single product by ID
  public async getProduct(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const product = await prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      return res.json({ product });
    } catch (error) {
      console.error("Get product error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Get product categories
  public async getCategories(req: Request, res: Response): Promise<Response> {
    try {
      const categories = await prisma.product.findMany({
        select: {
          category: true,
        },
        distinct: ["category"],
      });

      return res.json({
        categories: categories.map((c) => c.category),
      });
    } catch (error) {
      console.error("Get categories error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Get product aesthetics
  public async getAesthetics(req: Request, res: Response): Promise<Response> {
    try {
      const products = await prisma.product.findMany({
        select: {
          aesthetic: true,
        },
      });

      const aesthetics = [...new Set(products.flatMap((p) => p.aesthetic))];
      return res.json({ aesthetics });
    } catch (error) {
      console.error("Get aesthetics error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
