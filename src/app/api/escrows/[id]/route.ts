import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

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
