import { NextRequest, NextResponse } from "next/server";

import db from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> },
) {
  try {
    const { id, milestoneId } = await params;

    // 1. Update the milestone status
    const updatedMilestone = await db.milestone.update({
      where: { id: milestoneId, escrowLinkId: id },
      data: {
        status: "APPROVED_AND_PAID",
      },
    });

    // 2. Check if ALL milestones are now complete to mark the entire Escrow as Completed
    const allMilestones = await db.milestone.findMany({
      where: { escrowLinkId: id },
    });

    const allCompleted = allMilestones.every(
      (m) => m.status === "APPROVED_AND_PAID" || m.status === "AUTO_RELEASED",
    );

    if (allCompleted) {
      await db.escrowLink.update({
        where: { id },
        data: { status: "RELEASED" },
      });
    }

    return NextResponse.json({ success: true, milestone: updatedMilestone });
  } catch (error) {
    console.error("Error approving milestone:", error);
    return NextResponse.json(
      { error: "Failed to update database for milestone approval" },
      { status: 500 },
    );
  }
}
