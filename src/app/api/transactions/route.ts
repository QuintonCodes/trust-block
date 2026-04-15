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

    const normalizedFromAddress = fromAddress.toLowerCase();

    // 1. Ensure the user exists so the foreign key constraint on EscrowLink doesn't fail
    await db.user.upsert({
      where: { walletAddress: normalizedFromAddress },
      update: {},
      create: {
        walletAddress: normalizedFromAddress,
        role: "CLIENT",
      },
    });

    // Check if transaction already exists by tx_hash
    const existingTx = await db.transaction.findUnique({
      where: { txHash },
    });

    if (existingTx) {
      await db.escrowLink.update({
        where: { id: escrowLinkId },
        data: {
          status: "LOCKED",
          clientAddress: normalizedFromAddress,
        },
      });
      return NextResponse.json({ transaction: existingTx }, { status: 200 });
    }

    // Record the on-chain transaction in Prisma
    const [transaction] = await db.$transaction([
      db.transaction.create({
        data: {
          escrowLinkId,
          txHash,
          transactionType: "DEPOSIT",
          fromAddress: normalizedFromAddress,
          toAddress: toAddress ? toAddress.toLowerCase() : "",
          amount,
        },
      }),
      db.escrowLink.update({
        where: { id: escrowLinkId },
        data: {
          status: "LOCKED",
          clientAddress: normalizedFromAddress,
        },
      }),
    ]);

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
