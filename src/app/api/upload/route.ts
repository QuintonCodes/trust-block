import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Maximum file size: 25MB
const MAX_FILE_SIZE = 25 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // Check if Cloudinary is configured
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        {
          error:
            "Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.",
        },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const escrowId = formData.get("escrowId") as string | null;
    const milestoneId = formData.get("milestoneId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size exceeds maximum limit of 25MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        },
        { status: 400 },
      );
    }

    // Validate file type (only allow zip files)
    const allowedTypes = [
      "application/zip",
      "application/x-zip-compressed",
      "application/x-zip",
      "multipart/x-zip",
    ];
    const fileExtension = file.name.toLowerCase().split(".").pop();

    if (!allowedTypes.includes(file.type) && fileExtension !== "zip") {
      return NextResponse.json(
        { error: "Invalid file type. Only ZIP files are allowed." },
        { status: 400 },
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary as raw file
    const uploadPromise = new Promise<{
      secure_url: string;
      public_id: string;
      bytes: number;
    }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "raw",
            folder: `trustblock/submissions/${escrowId || "unknown"}`,
            public_id: `${milestoneId || "file"}_${Date.now()}`,
            format: "zip",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else if (result) {
              resolve({
                secure_url: result.secure_url,
                public_id: result.public_id,
                bytes: result.bytes,
              });
            }
          },
        )
        .end(buffer);
    });

    const result = await uploadPromise;

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      fileSize: result.bytes,
      fileName: file.name,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to upload file",
      },
      { status: 500 },
    );
  }
}
