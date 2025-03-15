import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/user/auth.routes";
import profileRoutes from "./routes/user/profile.routes";
import productRoutes from "./routes/user/product.routes";
import matchRoutes from "./routes/user/match.routes";
import cartRoutes from "./routes/user/cart.routes";
import orderRoutes from "./routes/user/order.routes";
import ratingRoutes from "./routes/user/rating.routes";
import returnRoutes from "./routes/user/return.routes";
import supplierRoutes from "./routes/supplier/supplier.routes";
import adminRoutes from "./routes/admin/admin.routes";

dotenv.config();

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/products", productRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/supplier", supplierRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("SERVER IS RUNNING:-)");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
