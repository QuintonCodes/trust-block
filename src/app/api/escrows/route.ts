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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      freelancerAddress,
      projectTitle,
      scopeOfWork,
      totalAmount,
      milestones,
    } = body;

    if (!freelancerAddress || !projectTitle || totalAmount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const finalMilestones =
      Array.isArray(milestones) && milestones.length > 0
        ? milestones
        : [
            {
              title: "Full Project",
              description: "Standard single payment",
              amount: totalAmount,
            },
          ];

    const newEscrow = await db.escrowLink.create({
      data: {
        freelancerAddress: freelancerAddress.toLowerCase(),
        projectTitle,
        scopeOfWork: scopeOfWork || "Standard Development Services",
        totalAmount,
        currency: "USDC",
        status: "DRAFT",
        milestones: {
          create: finalMilestones.map(
            (
              m: { title: string; description: string; amount: number },
              idx: number,
            ) => ({
              title: m.title,
              description: m.description || null,
              amount: m.amount,
              orderIndex: idx,
              status: "PENDING_FUNDS",
            }),
          ),
        },
      },
    });

    return NextResponse.json(
      { escrow: { ...newEscrow, totalAmount: Number(newEscrow.totalAmount) } },
      { status: 201 },
    );
  } catch (error) {
    console.error("Escrow Creation Error:", error);
    return NextResponse.json(
      { error: "Failed to create escrow" },
      { status: 500 },
    );
  }
}
