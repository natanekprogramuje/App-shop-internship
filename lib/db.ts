import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { Order, CreateOrderInput, UpdateOrderInput } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readOrders(): Order[] {
  ensureDataDir();
  if (!fs.existsSync(ORDERS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(ORDERS_FILE, "utf-8")) as Order[];
  } catch {
    return [];
  }
}

function writeOrders(orders: Order[]) {
  ensureDataDir();
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
}

export function getAllOrders(): Order[] {
  return readOrders().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getOrderById(id: string): Order | null {
  return readOrders().find((o) => o.id === id) ?? null;
}

export function createOrder(input: CreateOrderInput): Order {
  const orders = readOrders();
  const totalValue = input.items.reduce((sum, i) => sum + i.totalPrice, 0);
  const now = new Date().toISOString();
  const order: Order = {
    id: uuidv4(),
    ...input,
    status: "pending",
    totalValue,
    createdAt: now,
    updatedAt: now,
  };
  orders.push(order);
  writeOrders(orders);
  return order;
}

export function updateOrder(id: string, input: UpdateOrderInput): Order | null {
  const orders = readOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1 || orders[idx].status !== "pending") return null;
  const updated: Order = {
    ...orders[idx],
    ...input,
    totalValue: input.items
      ? input.items.reduce((sum, i) => sum + i.totalPrice, 0)
      : orders[idx].totalValue,
    updatedAt: new Date().toISOString(),
  };
  orders[idx] = updated;
  writeOrders(orders);
  return updated;
}

export function cancelOrder(id: string): Order | null {
  const orders = readOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1 || orders[idx].status === "cancelled") return null;
  orders[idx] = {
    ...orders[idx],
    status: "cancelled",
    updatedAt: new Date().toISOString(),
  };
  writeOrders(orders);
  return orders[idx];
}

export function approveOrder(id: string, adminNote?: string): Order | null {
  const orders = readOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1 || orders[idx].status !== "pending") return null;
  orders[idx] = {
    ...orders[idx],
    status: "approved",
    adminNote: adminNote ?? orders[idx].adminNote,
    updatedAt: new Date().toISOString(),
  };
  writeOrders(orders);
  return orders[idx];
}
