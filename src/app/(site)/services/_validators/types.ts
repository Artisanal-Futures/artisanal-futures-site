// import type { Service, Shop } from "@prisma/client";

// export type ServiceWithShop = Service & {
//   shop?: Shop;
// };

export type FastAPIService = {
  name: string;
  description: string;
  principles: string;
  the_artisan: string;
  url:string;
  image: string;
  serviceID: string; 
  assessment: FastAPIServiceAssessment[];
  id: number;
};

type FastAPIServiceAssessment = {
  type: string;
  version: number;
  description: string;
  data: string;
  data_reference: string;
  extra: string;
};