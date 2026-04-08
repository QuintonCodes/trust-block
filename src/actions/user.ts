"use server";

import db from "@/lib/db";

export async function syncUserLogin(walletAddress: string) {
  if (!walletAddress) return { success: false, error: "No address provided" };

  try {
    const user = await db.user.upsert({
      where: {
        walletAddress: walletAddress.toLowerCase(),
      },
      update: {
        lastLogin: new Date(),
      },
      create: {
        walletAddress: walletAddress.toLowerCase(),
        role: "WORKER", // Default role based on your Prisma schema
      },
    });

    return { success: true, user };
  } catch (error) {
    console.error("Database error syncing user:", error);
    return { success: false, error: "Failed to sync user to database" };
  }
}
