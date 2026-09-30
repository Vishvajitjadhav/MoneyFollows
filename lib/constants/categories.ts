/**
 * Default categories seeded for every new user (see database seed function).
 * `icon` and `color` are keys into the registries in components/category-icon.tsx,
 * so they can be stored as plain strings in the database.
 */

export type TransactionType = "EXPENSE" | "INCOME" | "INVESTMENT";

export type CategoryColor =
  | "coral"
  | "orange"
  | "amber"
  | "lime"
  | "green"
  | "teal"
  | "sky"
  | "blue"
  | "indigo"
  | "violet"
  | "pink"
  | "slate";

export type DefaultCategory = {
  name: string;
  type: TransactionType;
  icon: string;
  color: CategoryColor;
  subcategories: string[];
};

export const DEFAULT_EXPENSE_CATEGORIES: DefaultCategory[] = [
  { name: "Food", type: "EXPENSE", icon: "food", color: "orange", subcategories: ["Lunch", "Dinner", "Breakfast", "Milk", "Snacks", "Restaurant", "Other"] },
  { name: "Transport", type: "EXPENSE", icon: "transport", color: "sky", subcategories: ["Petrol", "Bike Service", "Car Service", "Cab", "Bus", "Parking", "Other"] },
  { name: "Housing", type: "EXPENSE", icon: "housing", color: "indigo", subcategories: ["Rent", "Maintenance", "Other"] },
  { name: "Bills", type: "EXPENSE", icon: "bills", color: "slate", subcategories: ["Electricity", "Internet", "Mobile", "Insurance", "Other"] },
  { name: "Family", type: "EXPENSE", icon: "family", color: "coral", subcategories: ["Parents", "Brother", "Sister", "Family", "Other"] },
  { name: "Lifestyle", type: "EXPENSE", icon: "lifestyle", color: "pink", subcategories: ["Gym", "Skincare", "Haircut", "Clothing", "Accessories", "Other"] },
  { name: "Shopping", type: "EXPENSE", icon: "shopping", color: "violet", subcategories: ["Electronics", "Watch", "Shoes", "Accessories", "Other"] },
  { name: "Entertainment", type: "EXPENSE", icon: "entertainment", color: "amber", subcategories: ["Movie", "OTT", "Games", "Events", "Other"] },
  { name: "Health", type: "EXPENSE", icon: "health", color: "green", subcategories: ["Medicine", "Doctor", "Other"] },
  { name: "Education", type: "EXPENSE", icon: "education", color: "blue", subcategories: ["Course", "Books", "Certification", "Other"] },
  { name: "Other", type: "EXPENSE", icon: "other", color: "slate", subcategories: [] },
];

export const DEFAULT_INCOME_CATEGORIES: DefaultCategory[] = [
  { name: "Salary", type: "INCOME", icon: "salary", color: "green", subcategories: [] },
  { name: "Freelance", type: "INCOME", icon: "freelance", color: "teal", subcategories: [] },
  { name: "Side income", type: "INCOME", icon: "side-income", color: "lime", subcategories: [] },
  { name: "Bonus", type: "INCOME", icon: "bonus", color: "amber", subcategories: [] },
  { name: "Gift", type: "INCOME", icon: "gift", color: "pink", subcategories: [] },
  { name: "Refund", type: "INCOME", icon: "refund", color: "sky", subcategories: [] },
  { name: "Other", type: "INCOME", icon: "other", color: "slate", subcategories: [] },
];

export const DEFAULT_INVESTMENT_CATEGORIES: DefaultCategory[] = [
  { name: "SIP", type: "INVESTMENT", icon: "sip", color: "indigo", subcategories: [] },
  { name: "Mutual Fund", type: "INVESTMENT", icon: "mutual-fund", color: "violet", subcategories: [] },
  { name: "Stocks", type: "INVESTMENT", icon: "stocks", color: "green", subcategories: [] },
  { name: "PPF", type: "INVESTMENT", icon: "ppf", color: "blue", subcategories: [] },
  { name: "FD", type: "INVESTMENT", icon: "fd", color: "teal", subcategories: [] },
  { name: "Other", type: "INVESTMENT", icon: "other", color: "slate", subcategories: [] },
];

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  ...DEFAULT_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES,
  ...DEFAULT_INVESTMENT_CATEGORIES,
];
