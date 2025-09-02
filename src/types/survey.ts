export type Survey = {
  id: string;
  processes: string | null;
  materials: string | null;
  principles: string | null;
  description: string | null;
  unmoderatedForm: boolean;
  moderatedForm: boolean;
  hiddenForm: boolean;
  privateForm: boolean;
  supplyChain: boolean;
  messagingOptIn: boolean;
  ownerId: string | null;
  shopId: string;
  createdAt: Date;
  updatedAt: Date;

  businessType: string | null;
  experience: string | null;
  practice: string | null;
  country: string | null;
  state: string | null;
  email: string | null;
};

export type GuestSurvey = {
  id: string;
  name: string | null;
  country: string | null;
  state: string | null;
  artisanalPractice: string | null;
  otherPractice: string | null;
  email: string;
  createdAt: Date;
  userId: string | null;
};
