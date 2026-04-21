import { NextRequest, NextResponse } from "next/server";

import db from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> },
) {
  try {
    const body = await request.json();
    const { id, milestoneId } = await params;
    const { submissionType, submissionUrl } = body;

    if (!submissionType || !submissionUrl) {
      return NextResponse.json(
        { error: "Missing submissionType or submissionUrl" },
        { status: 400 },
      );
    }

    const updatedMilestone = await db.milestone.update({
      where: {
        id: milestoneId,
        escrowLinkId: id,
      },
      data: {
        submissionType, // Will be "LINK" or "FILE"
        submissionUrl,
        status: "WORK_SUBMITTED",
        submittedAt: new Date(),
      },
    });

    return NextResponse.json(updatedMilestone);
  } catch (error) {
    console.error("Error submitting work to DB:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
