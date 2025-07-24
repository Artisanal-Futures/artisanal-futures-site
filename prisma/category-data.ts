import { CategoryType } from '@prisma/client';

type CategoryData = {
  name: string;
  type: CategoryType;
  keywords?: string[];
  children: {
    name: string;
    keywords: string[];
  }[];
}

export const categoriesWithKeywords: CategoryData[] = [
  {
    name: 'Clothing',
    type: CategoryType.PRODUCT,
    children: [
      { name: 'Tops', keywords: ['shirt', 'tee', 'blouse', 'tunic', 'crop top'] },
      { name: 'Bottoms', keywords: ['pants', 'skirt', 'jeans', 'trousers', 'shorts'] },
      { name: 'Dresses & Skirts', keywords: ['dress', 'skirt', 'gown', 'maxi'] },
      { name: 'Jackets', keywords: ['jacket', 'coat', 'blazer', 'trench'] },
      { name: 'Jumpsuits & Bodysuits', keywords: ['jumpsuit', 'romper', 'bodysuit']},
    ],
  },
  {
    name: 'Jewelry',
    type: CategoryType.PRODUCT,
    children: [
      { name: 'Rings', keywords: ['ring'] },
      { name: 'Necklaces & Pendants', keywords: ['necklace', 'pendant', 'pendent'] },
      { name: 'Earrings', keywords: ['earring', 'hoops'] },
      { name: 'Bracelets & Anklets', keywords: ['bracelet', 'anklet', 'bead', 'beads'] },
    ],
  },
  {
    name: 'Bags & Accessories',
    type: CategoryType.PRODUCT,
    children: [
      { name: 'Bags & Wallets', keywords: ['bag', 'wallet', 'purse', 'tote', 'crossbody', 'clutch', 'backpack'] },
      { name: 'Hats & Headwear', keywords: ['hat', 'beanie'] },
      { name: 'Masks (Sleeping/Eye)', keywords: ['sleeping mask', 'eye mask'] },
      { name: 'Apparel Solutions', keywords: ['lift tape', 'nipple covers', 'adhesive remover', 'shape tape'] },
      { name: 'Socks', keywords: ['socks']},
    ],
  },
  {
    name: 'Bath & Beauty',
    type: CategoryType.PRODUCT,
    children: [
      { name: 'Skincare', keywords: ['facial spray', 'face mask', 'hand balm', 'pimple', 'hydrogel', 'lip mask', 'firming solution'] },
      { name: 'Bath & Body', keywords: ['hand sanitizer', 'shower cap', 'fragrance roller', 'toiletry', 'mist case'] },
      { name: 'Tools & Brushes', keywords: ['gua sha', 'facial massager', 'ice roller', 'exfoliating dry brush', 'makeup clips'] },
    ],
  },
  {
    name: 'Home & Kitchen',
    type: CategoryType.PRODUCT,
    children: [
      { name: 'Decor', keywords: ['key hanger'] },
      { name: 'Bar & Drinkware', keywords: ['cocktail picks', 'drink garnishes', 'cocktail kit'] },
    ],
  },
  {
    name: 'Gift Cards',
    type: CategoryType.PRODUCT,
    children: [],
    keywords: ['gift card'], 
  },
  {
    name: 'Craft Supplies',
    type: CategoryType.PRODUCT,
    children: [
        { name: 'Craft Beads', keywords: ['amber', 'stone', 'labradorite', 'resin', 'wood beads'] },
        { name: 'Craft Components', keywords: ['coin', 'crosses']},
    ]
  },
  {
    name: 'Creative & Design',
    type: CategoryType.SERVICE,
    children: [
      { name: 'Graphic Design', keywords: ['logo', 'graphic design', 'branding'] },
      { name: 'Custom Artwork', keywords: ['illustration', 'painting', 'commission'] },
    ]
  },
  {
    name: 'Workshops & Classes',
    type: CategoryType.SERVICE,
    children: [
        { name: 'Art & Craft Classes', keywords: ['pottery', 'knitting', 'painting class'] },
        { name: 'Creative Workshops', keywords: ['workshop', 'lesson', 'course'] },
    ]
  },
  {
    name: 'Custom & Made-to-Order',
    type: CategoryType.SERVICE,
    children: [
        { name: 'Custom Furniture', keywords: ['woodworking', 'custom table'] },
        { name: 'Tailoring', keywords: ['tailoring', 'custom garment'] },
    ]
  },
  {
    name: 'Consulting & Expertise',
    type: CategoryType.SERVICE,
    children: [
        { name: 'Interior Design', keywords: ['interior design', 'consultation'] },
        { name: 'Creative Strategy', keywords: ['brand strategy', 'creative consulting'] },
    ]
  },
  {
    name: 'Nature & Wellness',
    type: CategoryType.SERVICE,
    children: [
        { name: 'Gardening & Cultivation', keywords: ['mushroom cultivating', 'gardening'] },
    ]
  }
];