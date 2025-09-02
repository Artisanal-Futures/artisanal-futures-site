export type FastAPIProduct = {
  name: string;
  description: string;
  principles: string;
  the_artisan: string;
  url: string;
  image: string;
  craftID: string;
  assessment: FastAPIAssessment[];
  id: number;
};

type FastAPIAssessment = {
  type: string;
  version: number;
  description: string;
  data: string;
  data_reference: string;
  extra: string;
};
