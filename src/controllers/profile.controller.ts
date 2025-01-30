import type { Response } from "express";
import { PrismaClient } from "@prisma/client";
import type {
  ProfileUpdateInput,
  PreferenceUpdateInput,
  LocationInput,
} from "../types/auth";
import type { AuthRequest } from "../middleware/auth.middleware";
import { calculateDistance } from "../utils/location.utils";

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

  // Update location
  public async updateLocation(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    try {
      const userId = req.user?.userId;
      const locationData: LocationInput = req.body;

      const updatedProfile = await prisma.profile.update({
        where: { userId },
        data: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          city: locationData.city,
          state: locationData.state,
          country: locationData.country,
          lastLocationUpdate: new Date(),
        },
      });

      return res.json({ profile: updatedProfile });
    } catch (error) {
      console.error("Location update error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Get nearby users
  public async getNearbyUsers(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    try {
      const userId = req.user?.userId;
      const maxDistance = parseInt(req.query.distance as string) || 100; // Default 100km

      // Get user's location
      const userProfile = await prisma.profile.findUnique({
        where: { userId },
        select: {
          latitude: true,
          longitude: true,
          user: {
            select: {
              preferences: true,
            },
          },
        },
      });

      if (!userProfile?.latitude || !userProfile?.longitude) {
        return res.status(400).json({ message: "Location not set" });
      }

      // Get all users
      const allProfiles = await prisma.profile.findMany({
        where: {
          userId: { not: userId },
          latitude: { not: null },
          longitude: { not: null },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      // Filter by distance
      const nearbyUsers = allProfiles.filter((profile) => {
        if (!profile.latitude || !profile.longitude) return false;

        const distance = calculateDistance(
          userProfile.latitude!,
          userProfile.longitude!,
          profile.latitude!,
          profile.longitude!
        );

        return distance <= maxDistance;
      });

      return res.json({ users: nearbyUsers });
    } catch (error) {
      console.error("Get nearby users error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
