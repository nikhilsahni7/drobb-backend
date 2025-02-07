import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";
import productRoutes from "./routes/product.routes";
import matchRoutes from "./routes/match.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/order.routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/products", productRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
