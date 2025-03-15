import type { Request, Response } from "express";
import { PrismaClient, UserRole } from "@prisma/client";
import { Resend } from "resend";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import type {
  SignupInput,
  LoginInput,
  VerifyOTPInput,
  SupplierSignupInput,
} from "../../types/types";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export class AuthController {
  // Generate OTP
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP email
  private async sendOTPEmail(email: string, otp: string) {
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: email,
        subject: "Verify your email",
        html: `Your OTP for verification is: <strong>${otp}</strong>. Valid for 10 minutes.`,
      });
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send OTP email");
    }
  }

  // Signup with role support
  public async signup(
    req: Request<{}, {}, SignupInput | SupplierSignupInput>,
    res: Response
  ): Promise<Response> {
    try {
      const {
        email,
        password,
        name,
        gender,
        birthDate,
        role = "USER",
      } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Generate and store OTP
      const otp = this.generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await prisma.oTP.create({
        data: {
          email,
          otp,
          expiresAt: otpExpiry,
        },
      });

      // Hash password
      const hashedPassword = await bcryptjs.hash(password, 10);

      // Create unverified user
      const userData = {
        email,
        password: hashedPassword,
        role: role === "SUPPLIER" ? UserRole.SUPPLIER : UserRole.USER,
        profile: {
          create: {
            name,
            gender,
            birthDate: new Date(birthDate),
          },
        },
      };

      const user = await prisma.user.create({ data: userData });

      // If supplier, create supplier record
      if (role === "SUPPLIER") {
        const supplierData = req.body as SupplierSignupInput;
        await prisma.supplier.create({
          data: {
            userId: user.id,
            businessName: supplierData.businessName,
            address: supplierData.address,
            phone: supplierData.phone,
          },
        });
      }

      // Send OTP email
      await this.sendOTPEmail(email, otp);

      return res.status(201).json({
        message:
          "Please verify your email with the OTP sent to your email address",
      });
    } catch (error) {
      console.error("Signup error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  public async verifyOTP(
    req: Request<{}, {}, VerifyOTPInput>,
    res: Response
  ): Promise<Response> {
    try {
      const { email, otp }: VerifyOTPInput = req.body;

      // Find the user first
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      const otpRecord = await prisma.oTP.findFirst({
        where: {
          email,
          otp,
          verified: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (!otpRecord) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      // Mark OTP as verified
      await prisma.oTP.update({
        where: { id: otpRecord.id },
        data: { verified: true },
      });

      // Generate JWT token with the user's ID
      const token = jwt.sign(
        { userId: user.id }, // Use the actual user ID
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      return res.json({
        message: "Email verified successfully",
        token,
        user: {
          id: user.id,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("OTP verification error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
  // Login with role information
  public async login(
    req: Request<{}, {}, LoginInput>,
    res: Response
  ): Promise<Response> {
    try {
      const { email, password }: LoginInput = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
        include: { profile: true, supplier: true },
      });

      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Verify password
      const validPassword = await bcryptjs.compare(password, user.password!);
      if (!validPassword) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Generate JWT token with role
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      // Return appropriate data based on role
      const userData = {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      };

      // Add supplier data if applicable
      if (user.role === "SUPPLIER" && user.supplier) {
        return res.json({
          token,
          user: {
            ...userData,
            supplier: {
              id: user.supplier.id,
              businessName: user.supplier.businessName,
              approved: user.supplier.approved,
            },
          },
        });
      }

      return res.json({ token, user: userData });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Create admin (one-time setup, should be protected)
  public async createAdmin(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password, adminSecret } = req.body;

      // Verify admin secret from environment variable
      if (adminSecret !== process.env.ADMIN_SECRET) {
        return res.status(403).json({ message: "Invalid admin secret" });
      }

      // Check if admin already exists
      const existingAdmin = await prisma.user.findFirst({
        where: { role: UserRole.ADMIN },
      });

      if (existingAdmin) {
        return res.status(400).json({ message: "Admin already exists" });
      }

      // Hash password
      const hashedPassword = await bcryptjs.hash(password, 10);

      // Create admin user
      const admin = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: UserRole.ADMIN,
          profile: {
            create: {
              name: "Admin",
              gender: "OTHER",
              birthDate: new Date(),
            },
          },
        },
      });

      return res.status(201).json({
        message: "Admin created successfully",
        admin: {
          id: admin.id,
          email: admin.email,
          role: admin.role,
        },
      });
    } catch (error) {
      console.error("Create admin error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
