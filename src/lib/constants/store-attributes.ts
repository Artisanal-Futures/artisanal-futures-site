export const STORE_ATTRIBUTES = [
  "African American Culture",
  "African Culture",
  "African American Civil Rights",
  "Black Owned",
  "Woman Owned",
  "Worker Owned",
  "Community Education",
  "Food Sovereignty",
] as const;

export type StoreAttribute = (typeof STORE_ATTRIBUTES)[number];
