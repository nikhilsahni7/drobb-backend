import type { Response } from "express";
import { PrismaClient } from "@prisma/client";
import type { ProfileUpdateInput, PreferenceUpdateInput } from "../types/types";
import type { AuthRequest } from "../middleware/auth.middleware";

const prisma = new PrismaClient();

export class ProfileController {
  // Update profile
  public async updateProfile(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    try {
      const userId = req.user?.userId;
      const profileData: ProfileUpdateInput = req.body;

      const updatedProfile = await prisma.profile.update({
        where: { userId },
        data: profileData,
      });

      return res.json({ profile: updatedProfile });
    } catch (error) {
      console.error("Profile update error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Update preferences
  public async updatePreferences(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    try {
      const userId = req.user?.userId;
      const preferenceData: PreferenceUpdateInput = req.body;

      const updatedPreferences = await prisma.preference.upsert({
        where: { userId },
        update: preferenceData,
        create: {
          userId: userId!,
          ...preferenceData,
        },
      });

      return res.json({ preferences: updatedPreferences });
    } catch (error) {
      console.error("Preferences update error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Get profile and preferences
  public async getProfile(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          preferences: true,
        },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json({
        profile: user.profile,
        preferences: user.preferences,
      });
    } catch (error) {
      console.error("Get profile error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
