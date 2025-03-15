import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import Decimal from "decimal.js";
import type { AestheticType } from "../../src/types/types";

const prisma = new PrismaClient();

const CLOTHING_CATEGORIES = [
  "T-Shirts",
  "Dresses",
  "Jeans",
  "Sweaters",
  "Jackets",
  "Skirts",
  "Pants",
  "Shorts",
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const AESTHETICS: AestheticType[] = [
  "STAR_GIRL",
  "SGANDI",
  "INDIE",
  "Y2K",
  "OLD_MONEY",
  "ALT",
  "COTTAGECORE",
  "DOWNTOWN",
];

// Clothing-specific adjectives and styles
const CLOTHING_ADJECTIVES = [
  "Slim-fit",
  "Oversized",
  "Cropped",
  "Vintage-inspired",
  "Classic",
  "Modern",
  "Relaxed-fit",
  "Premium",
  "Designer",
  "Casual",
  "Elegant",
  "Trendy",
  "Bohemian",
  "Minimalist",
  "Luxurious",
];

const CLOTHING_STYLES = {
  "T-Shirts": [
    "Graphic",
    "Plain",
    "Striped",
    "V-neck",
    "Crew neck",
    "Long sleeve",
    "Printed",
    "Basic",
    "Polo",
    "Designer",
  ],
  Dresses: [
    "Maxi",
    "Mini",
    "Midi",
    "Wrap",
    "A-line",
    "Bodycon",
    "Slip",
    "Shirt dress",
    "Party",
    "Summer",
  ],
  Jeans: [
    "Skinny",
    "Straight",
    "Boot-cut",
    "Mom",
    "Dad",
    "Boyfriend",
    "Distressed",
    "High-waisted",
    "Relaxed",
    "Cargo",
  ],
  Sweaters: [
    "Cardigan",
    "Pullover",
    "Turtleneck",
    "Cable-knit",
    "Cashmere",
    "Wool-blend",
    "V-neck",
    "Crew neck",
    "Oversized",
    "Cropped",
  ],
  Jackets: [
    "Bomber",
    "Denim",
    "Leather",
    "Blazer",
    "Puffer",
    "Windbreaker",
    "Varsity",
    "Trench",
    "Cropped",
    "Oversized",
  ],
  Skirts: [
    "Mini",
    "Midi",
    "Maxi",
    "Pleated",
    "A-line",
    "Pencil",
    "Wrap",
    "Denim",
    "Floral",
    "Printed",
  ],
  Pants: [
    "Chinos",
    "Trousers",
    "Cargo",
    "Wide-leg",
    "Straight-leg",
    "Cropped",
    "High-waisted",
    "Palazzo",
    "Linen",
    "Cotton",
  ],
  Shorts: [
    "Denim",
    "Cargo",
    "Bermuda",
    "Athletic",
    "Chino",
    "High-waisted",
    "Pleated",
    "Linen",
    "Cotton",
    "Printed",
  ],
};

const AESTHETIC_IMAGES = {
  STAR_GIRL: [
    "https://images.pexels.com/photos/1021693/pexels-photo-1021693.jpeg",
    "https://images.pexels.com/photos/1375736/pexels-photo-1375736.jpeg",
    "https://images.pexels.com/photos/1721558/pexels-photo-1721558.jpeg",
  ],
  SGANDI: [
    "https://images.pexels.com/photos/2043590/pexels-photo-2043590.jpeg",
    "https://images.pexels.com/photos/2584269/pexels-photo-2584269.jpeg",
    "https://images.pexels.com/photos/2681751/pexels-photo-2681751.jpeg",
  ],
  INDIE: [
    "https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg",
    "https://images.pexels.com/photos/1755428/pexels-photo-1755428.jpeg",
    "https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg",
  ],
  Y2K: [
    "https://images.pexels.com/photos/1040424/pexels-photo-1040424.jpeg",
    "https://images.pexels.com/photos/1485031/pexels-photo-1485031.jpeg",
    "https://images.pexels.com/photos/1537671/pexels-photo-1537671.jpeg",
  ],
  OLD_MONEY: [
    "https://images.pexels.com/photos/1549200/pexels-photo-1549200.jpeg",
    "https://images.pexels.com/photos/1644888/pexels-photo-1644888.jpeg",
    "https://images.pexels.com/photos/2002717/pexels-photo-2002717.jpeg",
  ],
  ALT: [
    "https://images.pexels.com/photos/1689731/pexels-photo-1689731.jpeg",
    "https://images.pexels.com/photos/1772475/pexels-photo-1772475.jpeg",
    "https://images.pexels.com/photos/1972115/pexels-photo-1972115.jpeg",
  ],
  COTTAGECORE: [
    "https://images.pexels.com/photos/1462637/pexels-photo-1462637.jpeg",
    "https://images.pexels.com/photos/1578997/pexels-photo-1578997.jpeg",
    "https://images.pexels.com/photos/1721558/pexels-photo-1721558.jpeg",
  ],
  DOWNTOWN: [
    "https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg",
    "https://images.pexels.com/photos/1759622/pexels-photo-1759622.jpeg",
    "https://images.pexels.com/photos/2043590/pexels-photo-2043590.jpeg",
  ],
} as const;

// Fallback images if we run out of aesthetic-specific ones
const FALLBACK_IMAGES = [
  "https://images.pexels.com/photos/994523/pexels-photo-994523.jpeg",
  "https://images.pexels.com/photos/1126993/pexels-photo-1126993.jpeg",
  "https://images.pexels.com/photos/1381556/pexels-photo-1381556.jpeg",
  "https://images.pexels.com/photos/1485781/pexels-photo-1485781.jpeg",
  "https://images.pexels.com/photos/1631181/pexels-photo-1631181.jpeg",
  "https://images.pexels.com/photos/1852382/pexels-photo-1852382.jpeg",
  "https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg",
  "https://images.pexels.com/photos/2002717/pexels-photo-2002717.jpeg",
];

async function clearExistingProducts() {
  try {
    await prisma.product.deleteMany({});
    console.log("Cleared existing products");
  } catch (error) {
    console.error("Error clearing products:", error);
  }
}

function generateProductName(category: string): string {
  const adjective = faker.helpers.arrayElement(CLOTHING_ADJECTIVES);
  const style = faker.helpers.arrayElement(
    CLOTHING_STYLES[category as keyof typeof CLOTHING_STYLES] || ["Standard"]
  );
  return `${adjective} ${style} ${category.slice(0, -1)}`;
}

function generateDescription(
  category: string,
  aesthetics: AestheticType[]
): string {
  const material = faker.helpers.arrayElement([
    "Cotton",
    "Polyester",
    "Linen",
    "Wool",
    "Silk",
    "Denim",
    "Jersey",
    "Cashmere",
    "Modal",
    "Viscose",
  ]);

  const fit = faker.helpers.arrayElement([
    "Regular fit",
    "Slim fit",
    "Relaxed fit",
    "Oversized fit",
    "Classic fit",
  ]);

  const aesthetic = aesthetics.join(" and ");

  return `${generateProductName(category)} made from premium ${material}. 
    Features a ${fit} design perfect for ${aesthetic} style. 
    ${faker.commerce.productDescription()}`;
}

function getPriceRange(category: string): { min: number; max: number } {
  const ranges = {
    "T-Shirts": { min: 599, max: 2999 },
    Dresses: { min: 1499, max: 7999 },
    Jeans: { min: 1999, max: 6999 },
    Sweaters: { min: 1299, max: 4999 },
    Jackets: { min: 2499, max: 9999 },
    Skirts: { min: 999, max: 3999 },
    Pants: { min: 1499, max: 5999 },
    Shorts: { min: 799, max: 2999 },
  };
  return ranges[category as keyof typeof ranges] || { min: 999, max: 4999 };
}

function getImagesForAesthetic(
  aesthetic: AestheticType,
  count: number
): string[] {
  const aestheticImages = AESTHETIC_IMAGES[aesthetic] || [];
  const images: string[] = [];

  for (let i = 0; i < count; i++) {
    if (i < aestheticImages.length) {
      images.push(aestheticImages[i]);
    } else {
      // Use fallback images if we run out of aesthetic-specific ones
      const fallbackIndex = i % FALLBACK_IMAGES.length;
      images.push(FALLBACK_IMAGES[fallbackIndex]);
    }
  }

  return images;
}

async function seedProducts(count: number = 50) {
  try {
    await clearExistingProducts();
    console.log("Starting to seed products...");

    const supplier = await prisma.supplier.findFirst({
      where: {
        id: "cm8apxbfz0006yk033ruhp7g2",
      },
    });

    if (!supplier) {
      console.error(
        "No approved supplier found. Please create and approve a supplier first."
      );
      return;
    }

    console.log(
      `Using supplier: ${supplier.businessName} (ID: ${supplier.id})`
    );

    // Update supplier to be approved if not already
    await prisma.supplier.update({
      where: { id: supplier.id },
      data: { approved: true },
    });

    console.log(`Supplier ${supplier.businessName} is now approved`);

    for (let i = 0; i < count; i++) {
      const category = faker.helpers.arrayElement(CLOTHING_CATEGORIES);
      const aesthetics = faker.helpers.arrayElements(AESTHETICS, {
        min: 1,
        max: 3,
      }) as AestheticType[];
      const priceRange = getPriceRange(category);

      const product = await prisma.product.create({
        data: {
          name: generateProductName(category),
          description: generateDescription(category, aesthetics),
          price: new Decimal(
            faker.number.int({
              min: priceRange.min,
              max: priceRange.max,
            })
          ),
          images: getImagesForAesthetic(aesthetics[0], 4),
          aesthetic: aesthetics,
          category,
          size: faker.helpers.arrayElements(SIZES, { min: 4, max: 6 }),
          inStock: true,
          supplierId: supplier.id,
          stockQuantity: faker.number.int({ min: 5, max: 50 }),
        },
      });

      if (i % 10 === 0) {
        console.log(`Created ${i + 1} products...`);
      }
    }

    console.log(
      `Successfully seeded ${count} products for supplier ${supplier.businessName}`
    );
  } catch (error) {
    console.error("Error seeding products:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeder
seedProducts();
