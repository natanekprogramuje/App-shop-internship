import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrder, cancelOrder } from "@/lib/db";
import { UpdateOrderInput } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const order = getOrderById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

const MAX_VALUE = 5000;
const MAX_QTY = 20;
const MIN_QTY = 1;

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const existing = getOrderById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status !== "pending") {
    return NextResponse.json({ error: "Only pending orders can be edited" }, { status: 400 });
  }

  const body: UpdateOrderInput = await req.json();

  if (body.items) {
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
    const priority = body.priority ?? existing.priority;
    const total = body.items.reduce((s, i) => s + i.totalPrice, 0);
    if (priority !== "high" && total > MAX_VALUE) {
      return NextResponse.json(
        { error: `Order value ${total} PLN exceeds limit of ${MAX_VALUE} PLN for non-high priority` },
        { status: 400 }
      );
    }
  }

  const updated = updateOrder(id, body);
  if (!updated) return NextResponse.json({ error: "Update failed" }, { status: 400 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const order = cancelOrder(id);
  if (!order) return NextResponse.json({ error: "Cannot cancel this order" }, { status: 400 });
  return NextResponse.json(order);
}
