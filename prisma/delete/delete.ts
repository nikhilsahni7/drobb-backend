import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    // Delete all records from tables
    await prisma.order.deleteMany({});
    await prisma.cart.deleteMany({});

    console.log("✅ Database cleared successfully!");
  } catch (error) {
    console.error("❌ Error clearing database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
