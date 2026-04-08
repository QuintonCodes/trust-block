import { NextRequest, NextResponse } from "next/server";

import db from "@/lib/db";
import type { EscrowStatus } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address")?.toLowerCase();
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "ALL";

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  try {
    const escrows = await db.escrowLink.findMany({
      where: {
        OR: [{ freelancerAddress: address }, { clientAddress: address }],
        ...(status !== "ALL" ? { status: status as EscrowStatus } : {}),
        ...(search
          ? {
              AND: [
                {
                  OR: [
                    { projectTitle: { contains: search, mode: "insensitive" } },
                    { scopeOfWork: { contains: search, mode: "insensitive" } },
                  ],
                },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    // Format Decimal amounts to numbers for JSON serialization
    const formattedEscrows = escrows.map((e) => ({
      ...e,
      totalAmount: Number(e.totalAmount),
    }));

    return NextResponse.json({ escrows: formattedEscrows });
  } catch (error) {
    console.error("Escrows API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch escrows" },
      { status: 500 },
    );
  }
}
