import { NextRequest, NextResponse } from "next/server";

import db from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> },
) {
  try {
    const { address } = await params;
    const normalizedAddress = address.toLowerCase();

    const user = await db.user.findUnique({
      where: { walletAddress: normalizedAddress },
    });

    return NextResponse.json({ user: user || null });
  } catch (error) {
    console.error("User Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> },
) {
  try {
    const { address } = await params;
    const normalizedAddress = address.toLowerCase();
    const body = await request.json();

    const { displayName, bio, role } = body;

    const updatedUser = await db.user.upsert({
      where: { walletAddress: normalizedAddress },
      update: {
        ...(displayName !== undefined && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(role && { role }),
      },
      create: {
        walletAddress: normalizedAddress,
        displayName: displayName || null,
        bio: bio || null,
        role: role || "WORKER",
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("User Update Error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}
