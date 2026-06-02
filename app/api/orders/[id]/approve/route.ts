import { NextRequest, NextResponse } from "next/server";
import { approveOrder } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body: { adminNote?: string } = await req.json().catch(() => ({}));
  const order = approveOrder(id, body.adminNote);
  if (!order) {
    return NextResponse.json({ error: "Cannot approve this order" }, { status: 400 });
  }
  return NextResponse.json(order);
}
