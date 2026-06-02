import { NextRequest, NextResponse } from "next/server";
import { getAllOrders, createOrder } from "@/lib/db";
import { CreateOrderInput } from "@/lib/types";

export async function GET() {
  const orders = getAllOrders();
  return NextResponse.json(orders);
}

const MAX_VALUE = 5000;
const MAX_QTY = 20;
const MIN_QTY = 1;

export async function POST(req: NextRequest) {
  const body: CreateOrderInput = await req.json();

  if (!body.employeeName?.trim()) {
    return NextResponse.json({ error: "employeeName is required" }, { status: 400 });
  }
  if (!body.department?.trim()) {
    return NextResponse.json({ error: "department is required" }, { status: 400 });
  }
  if (!body.justification?.trim()) {
    return NextResponse.json({ error: "justification is required" }, { status: 400 });
  }
  if (!["low", "medium", "high"].includes(body.priority)) {
    return NextResponse.json({ error: "invalid priority" }, { status: 400 });
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "items must be non-empty" }, { status: 400 });
  }
  for (const item of body.items) {
    if (item.quantity < MIN_QTY || item.quantity > MAX_QTY) {
      return NextResponse.json(
        { error: `Quantity for "${item.name}" must be between ${MIN_QTY} and ${MAX_QTY}` },
        { status: 400 }
      );
    }
    if (item.unitPrice <= 0) {
      return NextResponse.json({ error: `Unit price must be > 0` }, { status: 400 });
    }
  }

  const total = body.items.reduce((s, i) => s + i.totalPrice, 0);
  if (body.priority !== "high" && total > MAX_VALUE) {
    return NextResponse.json(
      { error: `Order value ${total} PLN exceeds limit of ${MAX_VALUE} PLN for non-high priority` },
      { status: 400 }
    );
  }

  const order = createOrder(body);
  return NextResponse.json(order, { status: 201 });
}
