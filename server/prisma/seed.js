import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const BRANDS = ["Dior", "Chanel", "Tom Ford", "Versace", "Yves Saint Laurent", "Creed"];
const CATEGORIES = ["Eau de Parfum", "Eau de Toilette", "Parfum", "Cologne"];

// img helper — uses Unsplash perfume photos
const img = (id) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

const PRODUCTS = [
  { name: "Sauvage", brand: "Dior", category: "Eau de Toilette", price: 95.0, stock: 25, volumeMl: 100, gender: "MALE", img: "1541643600914-78b084683601" },
  { name: "Miss Dior", brand: "Dior", category: "Eau de Parfum", price: 120.0, stock: 18, volumeMl: 100, gender: "FEMALE", img: "1592945403244-b3fbafd7f539" },
  { name: "Chanel No. 5", brand: "Chanel", category: "Parfum", price: 135.0, stock: 12, volumeMl: 50, gender: "FEMALE", img: "1588405748880-12d1d2a59f75" },
  { name: "Bleu de Chanel", brand: "Chanel", category: "Eau de Parfum", price: 110.0, stock: 20, volumeMl: 100, gender: "MALE", img: "1523293182086-7651a899d37f" },
  { name: "Black Orchid", brand: "Tom Ford", category: "Eau de Parfum", price: 165.0, stock: 8, volumeMl: 50, gender: "UNISEX", img: "1594035910387-fea47794261f" },
  { name: "Oud Wood", brand: "Tom Ford", category: "Eau de Parfum", price: 250.0, stock: 6, volumeMl: 50, gender: "UNISEX", img: "1615634260167-c8cdede054de" },
  { name: "Eros", brand: "Versace", category: "Eau de Toilette", price: 78.0, stock: 30, volumeMl: 100, gender: "MALE", img: "1610461888750-10bfc601b874" },
  { name: "Bright Crystal", brand: "Versace", category: "Eau de Toilette", price: 72.0, stock: 22, volumeMl: 90, gender: "FEMALE", img: "1557170334-a9632e77c6e4" },
  { name: "Black Opium", brand: "Yves Saint Laurent", category: "Eau de Parfum", price: 115.0, stock: 16, volumeMl: 90, gender: "FEMALE", img: "1606025391022-2b7b1b8c7d3a" },
  { name: "Y", brand: "Yves Saint Laurent", category: "Eau de Parfum", price: 98.0, stock: 19, volumeMl: 100, gender: "MALE", img: "1547887538-e3a2f32cb1cc" },
  { name: "Aventus", brand: "Creed", category: "Eau de Parfum", price: 395.0, stock: 5, volumeMl: 100, gender: "MALE", img: "1592914610354-fd354ea45e48" },
  { name: "Silver Mountain Water", brand: "Creed", category: "Eau de Parfum", price: 320.0, stock: 7, volumeMl: 100, gender: "UNISEX", img: "1563170351-be82bc888aa4" },
];

const description = (p) =>
  `${p.name} by ${p.brand} — a ${p.category.toLowerCase()} for ${p.gender.toLowerCase()}. A refined ${p.volumeMl}ml fragrance with a distinctive, long-lasting signature.`;

async function main() {
  console.log("Seeding database...");

  // Clean slate (respecting FK order)
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Users
  await prisma.user.create({
    data: {
      email: "admin@essence.test",
      passwordHash: await bcrypt.hash("admin123", 10),
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
    },
  });
  await prisma.user.create({
    data: {
      email: "customer@essence.test",
      passwordHash: await bcrypt.hash("customer123", 10),
      firstName: "Marija",
      lastName: "Kupac",
      role: "CUSTOMER",
    },
  });

  // Brands & categories
  const brandMap = {};
  for (const name of BRANDS) {
    brandMap[name] = await prisma.brand.create({ data: { name } });
  }
  const categoryMap = {};
  for (const name of CATEGORIES) {
    categoryMap[name] = await prisma.category.create({ data: { name } });
  }

  // Products
  for (const p of PRODUCTS) {
    await prisma.product.create({
      data: {
        name: p.name,
        description: description(p),
        price: p.price,
        stock: p.stock,
        volumeMl: p.volumeMl,
        gender: p.gender,
        imageUrl: img(p.img),
        brandId: brandMap[p.brand].id,
        categoryId: categoryMap[p.category].id,
      },
    });
  }

  console.log("Seed complete.");
  console.log("  Admin:    admin@essence.test / admin123");
  console.log("  Customer: customer@essence.test / customer123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
