import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import type { SignupInput, LoginInput, VerifyOTPInput } from "../types/types";

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

  // Signup
  public async signup(
    req: Request<{}, {}, SignupInput>,
    res: Response
  ): Promise<Response> {
    try {
      const { email, password, name, gender, birthDate }: SignupInput =
        req.body;

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
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          profile: {
            create: {
              name,
              gender,
              birthDate: new Date(birthDate),
            },
          },
        },
      });

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
  // Login
  public async login(
    req: Request<{}, {}, LoginInput>,
    res: Response
  ): Promise<Response> {
    try {
      const { email, password }: LoginInput = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
        include: { profile: true },
      });

      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Verify password
      const validPassword = await bcryptjs.compare(password, user.password!);
      if (!validPassword) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
        expiresIn: "7d",
      });

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          profile: user.profile,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
