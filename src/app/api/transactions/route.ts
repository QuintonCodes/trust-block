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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { escrowLinkId, txHash, fromAddress, toAddress, amount } = body;

    if (!escrowLinkId || !txHash || !fromAddress || amount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if transaction already exists by tx_hash
    const existingTx = await db.transaction.findUnique({
      where: { txHash },
    });

    if (existingTx) {
      return NextResponse.json({ transaction: existingTx }, { status: 200 });
    }

    // Record the on-chain transaction in Prisma
    const transaction = await db.transaction.create({
      data: {
        escrowLinkId,
        txHash,
        transactionType: "DEPOSIT",
        fromAddress,
        toAddress: toAddress || "",
        amount,
      },
    });

    // Update Escrow status and link the client address to whoever made the deposit
    await db.escrowLink.update({
      where: { id: escrowLinkId },
      data: {
        status: "LOCKED",
        clientAddress: fromAddress,
      },
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
