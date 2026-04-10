import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const escrow = await db.escrowLink.findUnique({
      where: { id },
      include: {
        milestones: {
          orderBy: { orderIndex: "asc" },
        },
        transactions: {
          orderBy: { timestamp: "desc" },
        },
      },
    });

    if (!escrow) {
      return NextResponse.json({ error: "Escrow not found" }, { status: 404 });
    }

    return NextResponse.json({ escrow });
  } catch (error) {
    console.error("Escrow Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch escrow" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const body = await request.json();
    const { status, clientAddress } = body;

    const updatedEscrow = await db.escrowLink.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(clientAddress && { clientAddress: clientAddress.toLowerCase() }),
      },
    });

    return NextResponse.json({ escrow: updatedEscrow });
  } catch (error) {
    console.error("Escrow Update Error:", error);
    return NextResponse.json(
      { error: "Failed to update escrow" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const escrow = await db.escrowLink.findUnique({
      where: { id, status: "DRAFT" },
      select: { status: true },
    });

    if (!escrow) {
      return NextResponse.json({ error: "Escrow not found" }, { status: 404 });
    }

    if (escrow.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft escrows can be deleted." },
        { status: 400 },
      );
    }

    await db.escrowLink.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Escrow Delete Error:", error);
    return NextResponse.json(
      { error: "Failed to delete escrow" },
      { status: 500 },
    );
  }
}
