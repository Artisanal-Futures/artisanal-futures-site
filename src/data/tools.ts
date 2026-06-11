export const UPCY_URL = "https://generate.dev.artisanalfutures.org/";

export type Tool = {
  title: string;
  subtitle: string;
  type: string;
  image: string;
  url: string;
  /** When true, the tool is only shown to signed-in users (not public). */
  requiresAuth?: boolean;
};

export const TOOLS_DATA: Tool[] = [
  // {
  //   title: "Solidarity Pathways (Update In Progress)",
  //   subtitle: "Optimize your delivery route",
  //   type: "Logistics",
  //   image: "img/route_optimization.png",
  //   url: "#!",
  // },
  // {
  //   title: 'Neural Style Transfer',
  //   subtitle: 'Recreate an image in the style of another',
  //   type: 'Logistics',
  //   image: 'img/craft_composition.png',
  //   url: 'https://artisanal-futures-style-transfer.netlify.app/',
  // },

  {
    title: "Shop Rate Calculator",
    subtitle: "Calculate your shop rate",
    type: "Logistics",
    image: "img/route_optimization.png",
    url: "/tools/shop-rate-calculator",
  },
  {
    title: "Sankofa Sizer",
    subtitle: "Generate cloth patterns using AI",
    type: "Design",
    image: "img/ai_cloth.png",
    url: "/tools/sankofa-sizer",
  },
  {
    title: "UPCY",
    subtitle: "Upcycle your old scraps into new designs",
    type: "Design",
    image: "img/craft_composition.png",
    url: UPCY_URL,
    requiresAuth: true,
  },
];
