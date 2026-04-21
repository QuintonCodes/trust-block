"use client";

import {
  AlertCircle,
  CheckCircle2,
  FileArchive,
  Link as LinkIcon,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useFileUpload } from "@/lib/api/hooks/use-file-upload";
import { Milestone } from "@/lib/types";

type SubmitWorkModalProps = {
  isOpen: boolean;
  onClose: () => void;
  milestone: Milestone;
  escrowId: string;
  onSubmit: (
    submissionType: "link" | "file",
    submissionData: string,
  ) => Promise<void>;
  isSubmitting: boolean;
};

type SubmissionType = "link" | "file" | null;

export function SubmitWorkModal({
  isOpen,
  onClose,
  milestone,
  escrowId,
  onSubmit,
  isSubmitting,
}: SubmitWorkModalProps) {
  const [submissionType, setSubmissionType] = useState<SubmissionType>(null);
  const [deploymentUrl, setDeploymentUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    upload,
    isUploading,
    uploadProgress,
    error: uploadError,
    reset: resetUpload,
  } = useFileUpload();

  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setValidationError(null);
    setUploadedUrl(null);

    if (!file) return;

    // Validate file type
    const fileExtension = file.name.toLowerCase().split(".").pop();
    if (fileExtension !== "zip") {
      setValidationError("Only ZIP files are allowed");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setValidationError(
        `File size exceeds 25MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      );
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadFile = async () => {
    if (!selectedFile) return;

    try {
      const result = await upload({
        file: selectedFile,
        escrowId,
        milestoneId: milestone.id,
      });
      setUploadedUrl(result.url);
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleSubmit = async () => {
    if (submissionType === "link") {
      // Validate URL
      try {
        new URL(deploymentUrl);
      } catch {
        setValidationError("Please enter a valid URL");
        return;
      }
      await onSubmit("link", deploymentUrl);
    } else if (submissionType === "file" && uploadedUrl) {
      await onSubmit("file", uploadedUrl);
    }
    handleClose();
  };

  const handleClose = () => {
    setSubmissionType(null);
    setDeploymentUrl("");
    setSelectedFile(null);
    setUploadedUrl(null);
    setValidationError(null);
    resetUpload();
    onClose();
  };

  const isSubmitDisabled =
    isSubmitting ||
    isUploading ||
    (submissionType === "link" && !deploymentUrl) ||
    (submissionType === "file" && !uploadedUrl);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg bg-[#1E293B] border-[#334155]">
        <DialogHeader>
          <DialogTitle className="text-white">
            Submit Work for Review
          </DialogTitle>
          <DialogDescription className="text-[#A9B5C6]">
            Submit your completed work for &quot;{milestone.title}&quot; to
            request client approval and release of funds.
          </DialogDescription>
        </DialogHeader>

        {/* Submission Type Selection */}
        {!submissionType && (
          <div className="py-4 space-y-4">
            <p className="text-sm text-[#A9B5C6]">
              How would you like to submit your work?
            </p>
            <div className="grid gap-3">
              <button
                onClick={() => setSubmissionType("link")}
                className="flex items-center gap-4 rounded-lg border border-[#334155] bg-[#111827] p-4 text-left hover:border-[#4F46E5] hover:bg-[#4F46E5]/5 transition-colors"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#4F46E5]/20">
                  <LinkIcon className="h-6 w-6 text-[#4F46E5]" />
                </div>
                <div>
                  <p className="font-medium text-white">Deployment Link</p>
                  <p className="text-sm text-[#A9B5C6]">
                    Submit a live URL from Vercel, Netlify, or any hosting
                    platform
                  </p>
                </div>
              </button>

              <button
                onClick={() => setSubmissionType("file")}
                className="flex items-center gap-4 rounded-lg border border-[#334155] bg-[#111827] p-4 text-left hover:border-[#4F46E5] hover:bg-[#4F46E5]/5 transition-colors"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0FA976]/20">
                  <FileArchive className="h-6 w-6 text-[#0FA976]" />
                </div>
                <div>
                  <p className="font-medium text-white">Upload ZIP File</p>
                  <p className="text-sm text-[#A9B5C6]">
                    Upload a compressed archive of your deliverables (max 25MB)
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Deployment Link Input */}
        {submissionType === "link" && (
          <div className="py-4 space-y-4">
            <button
              onClick={() => setSubmissionType(null)}
              className="text-sm text-[#A9B5C6] hover:text-white flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Change submission type
            </button>

            <div className="space-y-2">
              <Label htmlFor="deploymentUrl" className="text-[#A9B5C6]">
                Deployment URL
              </Label>
              <Input
                id="deploymentUrl"
                type="url"
                placeholder="https://your-project.vercel.app"
                value={deploymentUrl}
                onChange={(e) => {
                  setDeploymentUrl(e.target.value);
                  setValidationError(null);
                }}
                className="border-[#334155] bg-[#111827] text-white placeholder:text-[#A9B5C6]/50"
              />
              <p className="text-xs text-[#A9B5C6]">
                Provide the live deployment URL where your client can review the
                work
              </p>
            </div>

            {validationError && (
              <div className="flex items-center gap-2 text-sm text-[#EF4444]">
                <AlertCircle className="w-4 h-4" />
                {validationError}
              </div>
            )}
          </div>
        )}

        {/* File Upload */}
        {submissionType === "file" && (
          <div className="py-4 space-y-4">
            <button
              onClick={() => setSubmissionType(null)}
              className="text-sm text-[#A9B5C6] hover:text-white flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Change submission type
            </button>

            {!uploadedUrl ? (
              <>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer rounded-lg border-2 border-dashed border-[#334155] bg-[#111827] p-8 text-center hover:border-[#4F46E5] hover:bg-[#4F46E5]/5 transition-colors"
                >
                  <Upload className="mx-auto h-10 w-10 text-[#A9B5C6] mb-3" />
                  <p className="text-sm text-white">
                    {selectedFile
                      ? selectedFile.name
                      : "Click to select a ZIP file"}
                  </p>
                  <p className="text-xs text-[#A9B5C6] mt-1">
                    Maximum file size: 25MB
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip,application/zip,application/x-zip-compressed"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {selectedFile && !isUploading && (
                  <div className="flex items-center justify-between rounded-lg border border-[#334155] bg-[#111827] p-3">
                    <div className="flex items-center gap-3">
                      <FileArchive className="h-5 w-5 text-[#0FA976]" />
                      <div>
                        <p className="text-sm text-white">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-[#A9B5C6]">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleUploadFile}
                      size="sm"
                      className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
                    >
                      Upload
                    </Button>
                  </div>
                )}

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#A9B5C6]">Uploading...</span>
                      <span className="text-white">{uploadProgress}%</span>
                    </div>
                    <Progress
                      value={uploadProgress}
                      className="h-2 bg-[#334155]"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-lg border border-[#0FA976]/30 bg-[#0FA976]/10 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#0FA976]" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      File uploaded successfully
                    </p>
                    <p className="text-xs text-[#A9B5C6] mt-1 break-all">
                      {uploadedUrl}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(validationError || uploadError) && (
              <div className="flex items-center gap-2 text-sm text-[#EF4444]">
                <AlertCircle className="w-4 h-4" />
                {validationError || uploadError?.message}
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        {submissionType && (
          <div className="flex justify-end gap-3 pt-4 border-t border-[#334155]">
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-[#334155] text-[#A9B5C6] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit for Review"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
