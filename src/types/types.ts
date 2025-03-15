export interface SignupInput {
  email: string;
  password: string;
  name: string;
  gender: "MALE" | "FEMALE" | "NON_BINARY" | "OTHER";
  birthDate: Date;
  role?: "USER" | "SUPPLIER";
}

export interface SupplierSignupInput extends SignupInput {
  businessName: string;
  address: string;
  phone: string;
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

export interface ReturnRequestInput {
  orderId: string;
  reason:
    | "CHANGED_MIND"
    | "WRONG_SIZE"
    | "FAULTY_PRODUCT"
    | "DAMAGED_PRODUCT"
    | "OTHER";
  description?: string;
}

export interface VerifyReturnInput {
  returnId: string;
  isFaulty: boolean;
}

export interface SupplierProductInput {
  name: string;
  description: string;
  price: number;
  images: string[];
  aesthetic: AestheticType[];
  category: string;
  size: string[];
  stockQuantity: number;
}

export interface AdminPayoutInput {
  supplierId: string;
  amount: number;
  description?: string;
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
