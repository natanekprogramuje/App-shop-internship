export type Priority = "low" | "medium" | "high";
export type OrderStatus = "pending" | "approved" | "cancelled";

export interface CatalogItem {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  categoryEn: string;
  estimatedPrice: number;
  description: string;
  descriptionEn: string;
  icon: string;
}

export interface OrderItem {
  catalogItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  employeeName: string;
  department: string;
  justification: string;
  priority: Priority;
  items: OrderItem[];
  status: OrderStatus;
  totalValue: number;
  createdAt: string;
  updatedAt: string;
  adminNote?: string;
}

export interface CreateOrderInput {
  employeeName: string;
  department: string;
  justification: string;
  priority: Priority;
  items: OrderItem[];
}

export type UpdateOrderInput = Partial<CreateOrderInput>;
