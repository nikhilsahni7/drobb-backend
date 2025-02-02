export interface SignupInput {
  email: string;
  password: string;
  name: string;
  gender: "MALE" | "FEMALE" | "NON_BINARY" | "OTHER";
  birthDate: Date;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface VerifyOTPInput {
  email: string;
  otp: string;
}

export interface ProfileUpdateInput {
  name?: string;
  gender?: "MALE" | "FEMALE" | "NON_BINARY" | "OTHER";
  birthDate?: Date;
  bio?: string;
  avatar?: string;
  aesthetic?: AestheticType[];
  photos?: string[];
}

export interface PreferenceUpdateInput {
  aesthetics?: AestheticType[];
  clothingTypes?: string[];
}

export type AestheticType =
  | "STAR_GIRL"
  | "SGANDI"
  | "INDIE"
  | "Y2K"
  | "OLD_MONEY"
  | "ALT"
  | "COTTAGECORE"
  | "DOWNTOWN";
