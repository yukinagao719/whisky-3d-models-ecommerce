export type Product = {
  id: string;
  name: string;
  nameEn: string;
  price: number;
  description: string;
  displayOrder: number;
  videoUrl: string | null;
  imageUrl: string;
  modelUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CartItem = {
  id: string;
  name: string;
  nameEn: string;
  price: number;
  imageUrl: string;
};

export type PurchaseHistory = {
  orderNumber: string;
  totalAmount: number;
  createdAt: Date;
  items: {
    id: string;
    name: string;
    nameEn: string;
    price: number;
    product: {
      imageUrl: string;
    };
  }[];
};
