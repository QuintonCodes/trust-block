import { NextRequest, NextResponse } from "next/server";

import db from "@/lib/db";
import type { TransactionType } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");

    // Build the where clause conditionally based on the filter
    const whereClause =
      type && type !== "ALL"
        ? { transactionType: type as TransactionType }
        : {};

    const transactions = await db.transaction.findMany({
      where: whereClause,
      orderBy: { timestamp: "desc" },
      include: {
        // Include the related escrow to get the project title easily
        escrowLink: {
          select: {
            projectTitle: true,
          },
        },
      },
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Transactions Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 },
    );
  }
}
