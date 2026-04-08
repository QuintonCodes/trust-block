import { NextRequest, NextResponse } from "next/server";

import db from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address")?.toLowerCase();

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  try {
    const escrows = await db.escrowLink.findMany({
      where: {
        OR: [{ freelancerAddress: address }, { clientAddress: address }],
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    });

    // 2. Fetch recent transactions related to the user's escrows
    const escrowIds = escrows.map((e) => e.id);
    const transactions = await db.transaction.findMany({
      where: {
        escrowLinkId: { in: escrowIds },
      },
      orderBy: { timestamp: "desc" },
      take: 5, // Limit to 5 most recent
    });

    // 3. Calculate Metrics
    const activeEscrows = escrows.filter(
      (e) => !["DRAFT", "RELEASED", "CANCELLED"].includes(e.status),
    );
    const completedEscrows = escrows.filter((e) => e.status === "RELEASED");

    // Calculate total volume (sum of all escrow amounts)
    const totalVolume = escrows.reduce(
      (sum, escrow) => sum + Number(escrow.totalAmount),
      0,
    );

    const metrics = [
      {
        title: "Active Escrows",
        value: activeEscrows.length.toString(),
        description: "Currently in progress",
      },
      {
        title: "Total Volume",
        value: `$${totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        description: "Lifetime transaction volume",
      },
      {
        title: "Completed Projects",
        value: completedEscrows.length.toString(),
        description: "Successfully released escrows",
      },
    ];

    // Return sanitized data (Prisma Decimals need to be converted to numbers/strings for JSON)
    return NextResponse.json({
      metrics,
      activeEscrows: activeEscrows.map((e) => ({
        ...e,
        totalAmount: Number(e.totalAmount),
      })),
      transactions: transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
      })),
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
