import hoodieGrey from "@/assets/p-hoodie-grey.jpg";
import hoodieRed from "@/assets/p-hoodie-red.jpg";
import jeansBlack from "@/assets/p-jeans-black.jpg";
import teeBlack from "@/assets/p-tee-black.jpg";
import teeWhite from "@/assets/p-tee-white.jpg";
import bag from "@/assets/p-bag.jpg";
import sneakers from "@/assets/p-sneakers.jpg";
import denim from "@/assets/p-denim.jpg";
import hat from "@/assets/p-hat.jpg";
import { getImageSrc } from "@/lib/utils";

const imgHoodieGrey = getImageSrc(hoodieGrey);
const imgHoodieRed = getImageSrc(hoodieRed);
const imgJeansBlack = getImageSrc(jeansBlack);
const imgTeeBlack = getImageSrc(teeBlack);
const imgTeeWhite = getImageSrc(teeWhite);
const imgBag = getImageSrc(bag);
const imgSneakers = getImageSrc(sneakers);
const imgDenim = getImageSrc(denim);
const imgHat = getImageSrc(hat);

export type Product = {
  id: string;
  slug?: string;
  name: string;
  image: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews?: number;
  flash?: boolean;
  category?: string;
};

export const trendy: Product[] = [
  { id: "t1", name: "Classic French Mens Hoodie", image: imgHoodieGrey, price: 150, rating: 4, category: "Men" },
  { id: "t2", name: "Team Red Hoodie", image: imgHoodieRed, price: 60, oldPrice: 120, rating: 5, reviews: 12, flash: true, category: "Women" },
  { id: "t3", name: "Classic Gabardine Pant", image: imgJeansBlack, price: 25, oldPrice: 50, rating: 4, flash: true, category: "Pants" },
  { id: "t4", name: "Slim Fit Jeans", image: imgJeansBlack, price: 120, rating: 4, category: "Pants" },
  { id: "t5", name: "Dri-Fit Miler", image: imgTeeBlack, price: 100, rating: 5, category: "T-shirt" },
  { id: "t6", name: "Sportswear Club Tee", image: imgTeeWhite, price: 70, rating: 4, category: "T-shirt" },
  { id: "t7", name: "Denim Jacket", image: imgDenim, price: 120, oldPrice: 160, rating: 4, flash: true, category: "Men" },
  { id: "t8", name: "Utility Power Bag", image: imgBag, price: 135, oldPrice: 270, rating: 5, flash: true, category: "Bags" },
];

export const ethnic: Product[] = [
  { id: "e1", name: "Embroidered Kurti", image: imgTeeWhite, price: 95, oldPrice: 130, rating: 5, flash: true, category: "Kurti" },
  { id: "e2", name: "Cotton Casual Kurti", image: imgTeeWhite, price: 75, rating: 4, category: "Kurti" },
  { id: "e3", name: "Classic Cotton Panjabi", image: imgHoodieGrey, price: 110, oldPrice: 150, rating: 5, category: "Panjabi" },
  { id: "e4", name: "Festive Silk Panjabi", image: imgHoodieGrey, price: 180, rating: 4, category: "Panjabi" },
];

export const popular: Product[] = [
  { id: "p1", name: "Utility Power Bag", image: imgBag, price: 135, oldPrice: 270, rating: 4, flash: true, category: "Bags" },
  { id: "p2", name: "Regular Essential Tee", image: imgTeeWhite, price: 112, oldPrice: 140, rating: 4, flash: true, category: "T-shirt" },
  { id: "p3", name: "Denim Jacket", image: imgDenim, price: 120, oldPrice: 160, rating: 5, flash: true, category: "Men" },
  { id: "p4", name: "Team Red Hoodie", image: imgHoodieRed, price: 60, oldPrice: 120, rating: 5, reviews: 12, flash: true, category: "Women" },
  { id: "p5", name: "Dri-Fit Miler", image: imgTeeBlack, price: 100, rating: 4, category: "T-shirt" },
  { id: "p6", name: "Phoenix Fleece", image: imgHoodieGrey, price: 100, rating: 4, category: "Men" },
  { id: "p7", name: "Unisex Bucket Hat", image: imgHat, price: 80, oldPrice: 100, rating: 4, category: "Boys" },
  { id: "p8", name: "Air Hoodie", image: imgHoodieGrey, price: 100, rating: 5, category: "Women" },
];

export const flashSale: Product[] = [
  { id: "f1", name: "Revolution 6 FlyEase", image: imgSneakers, price: 112, oldPrice: 140, rating: 4, flash: true, category: "Boys" },
  { id: "f2", name: "Utility Boonie Hat", image: imgHat, price: 40, oldPrice: 80, rating: 4, flash: true, category: "Boys" },
  { id: "f3", name: "Slipstream Sandal", image: imgSneakers, price: 50, oldPrice: 100, rating: 4, flash: true, category: "Boys" },
  { id: "f4", name: "Denim Jacket", image: imgDenim, price: 120, oldPrice: 160, rating: 5, flash: true, category: "Men" },
  { id: "f5", name: "Jordan 1 Low SE", image: imgSneakers, price: 160, oldPrice: 300, rating: 4, flash: true, category: "Men" },
  { id: "f6", name: "Utility Power Bag", image: imgBag, price: 135, oldPrice: 270, rating: 4, flash: true, category: "Bags" },
  { id: "f7", name: "Tech Fit Leggings", image: imgTeeBlack, price: 80, oldPrice: 100, rating: 4, flash: true, category: "Women" },
  { id: "f8", name: "Squad Big Kid Hoodie", image: imgHoodieRed, price: 80, oldPrice: 160, rating: 5, flash: true, category: "Boys" },
];

export const demoProducts: Product[] = [
  { id: "d1", name: "Oversized Fleece Hoodie", image: imgHoodieGrey, price: 145, oldPrice: 190, rating: 4, reviews: 34, flash: true, category: "Men" },
  { id: "d2", name: "Formal Chino Trouser", image: imgJeansBlack, price: 95, rating: 4, reviews: 18, category: "Pants" },
  { id: "d3", name: "Cargo Jogger Pant", image: imgJeansBlack, price: 88, oldPrice: 110, rating: 5, reviews: 41, flash: true, category: "Pants" },
  { id: "d4", name: "Everyday Crew Tee", image: imgTeeWhite, price: 45, rating: 4, reviews: 26, category: "T-shirt" },
  { id: "d5", name: "Graphic Print Tee", image: imgTeeBlack, price: 55, oldPrice: 70, rating: 4, reviews: 12, flash: true, category: "T-shirt" },
  { id: "d6", name: "Handloom Cotton Kurti", image: imgTeeWhite, price: 120, oldPrice: 165, rating: 5, reviews: 52, flash: true, category: "Kurti" },
  { id: "d7", name: "Printed A-Line Kurti", image: imgTeeWhite, price: 88, rating: 4, reviews: 19, category: "Kurti" },
  { id: "d8", name: "Eid Special Panjabi", image: imgHoodieGrey, price: 210, oldPrice: 280, rating: 5, reviews: 63, flash: true, category: "Panjabi" },
  { id: "d9", name: "Slim Fit Linen Panjabi", image: imgHoodieGrey, price: 165, rating: 4, reviews: 21, category: "Panjabi" },
  { id: "d10", name: "Kids Denim Jacket", image: imgDenim, price: 90, oldPrice: 125, rating: 4, reviews: 15, flash: true, category: "Boys" },
  { id: "d11", name: "Boys Running Sneaker", image: imgSneakers, price: 105, rating: 5, reviews: 30, category: "Boys" },
  { id: "d12", name: "Travel Duffle Bag", image: imgBag, price: 175, oldPrice: 220, rating: 4, reviews: 22, flash: true, category: "Bags" },
  { id: "d13", name: "Everyday Tote Bag", image: imgBag, price: 95, rating: 4, reviews: 9, category: "Bags" },
  { id: "d14", name: "Ladies Puffer Jacket", image: imgHoodieRed, price: 190, oldPrice: 240, rating: 5, reviews: 47, flash: true, category: "Women" },
  { id: "d15", name: "Knitted Cardigan", image: imgHoodieRed, price: 130, rating: 4, reviews: 11, category: "Women" },
  { id: "d16", name: "Summer Bucket Hat", image: imgHat, price: 35, oldPrice: 55, rating: 4, reviews: 8, flash: true, category: "Boys" },
  { id: "d17", name: "Classic Court Sneaker", image: imgSneakers, price: 150, rating: 5, reviews: 38, category: "Men" },
  { id: "d18", name: "Washed Denim Shirt", image: imgDenim, price: 115, oldPrice: 145, rating: 4, reviews: 17, flash: true, category: "Men" },
];

const seen = new Set<string>();
export const allProducts: Product[] = [
  ...trendy,
  ...ethnic,
  ...popular,
  ...flashSale,
  ...demoProducts,
].filter((p) => (seen.has(p.name) ? false : seen.add(p.name)));

export const categories = [
  { name: "Men", image: imgTeeBlack },
  { name: "Women", image: imgHoodieRed },
  { name: "Kurti", image: imgTeeWhite },
  { name: "Panjabi", image: imgHoodieGrey },
  { name: "Boys", image: imgDenim },
  { name: "T-shirt", image: imgTeeBlack },
  { name: "Pants", image: imgJeansBlack },
  { name: "Bags", image: imgBag },
];

export const brands = ["Babymel", "Burberry", "Camper", "Chanel", "Dr. Martens", "Fila"];