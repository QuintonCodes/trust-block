"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

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

const submitWorkSchema = z
  .object({
    submissionType: z.enum(["link", "file"]).nullable(),
    deploymentUrl: z.string().optional(),
    fileUrl: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.submissionType === "link") {
      try {
        new URL(data.deploymentUrl || "");
      } catch {
        ctx.addIssue({
          code: "custom",
          message: "Please enter a valid URL",
          path: ["deploymentUrl"],
        });
      }
    }
    if (data.submissionType === "file" && !data.fileUrl) {
      ctx.addIssue({
        code: "custom",
        message: "Please upload a file before submitting",
        path: ["fileUrl"],
      });
    }
  });

type SubmitWorkValues = z.infer<typeof submitWorkSchema>;

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

export function SubmitWorkModal({
  isOpen,
  onClose,
  milestone,
  escrowId,
  onSubmit,
  isSubmitting,
}: SubmitWorkModalProps) {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset: resetForm,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<SubmitWorkValues>({
    resolver: zodResolver(submitWorkSchema),
    defaultValues: { submissionType: null, deploymentUrl: "", fileUrl: "" },
  });

  const submissionType =
    useWatch({ control: control, name: "submissionType" }) || null;
  const fileUrl = useWatch({ control: control, name: "fileUrl" }) || "";
  const deploymentUrl =
    useWatch({ control: control, name: "deploymentUrl" }) || "";

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    upload,
    isUploading,
    uploadProgress,
    error: uploadError,
    reset: resetUpload,
  } = useFileUpload();

  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    clearErrors("fileUrl");
    setValue("fileUrl", "");

    if (!file) return;

    // Validate file type
    const fileExtension = file.name.toLowerCase().split(".").pop();
    if (fileExtension !== "zip") {
      setError("fileUrl", { message: "Only ZIP files are allowed" });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError("fileUrl", {
        message: `File size exceeds 25MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      });
      return;
    }

    setSelectedFile(file);
  }

  async function handleUploadFile() {
    if (!selectedFile) return;

    try {
      const result = await upload({
        file: selectedFile,
        escrowId,
        milestoneId: milestone.id,
      });
      setValue("fileUrl", result.url);
      clearErrors("fileUrl");
    } catch {
      setError("fileUrl", { message: "Upload failed" });
    }
  }

  async function onSubmitForm(data: SubmitWorkValues) {
    if (data.submissionType === "link" && data.deploymentUrl) {
      await onSubmit("link", data.deploymentUrl);
    } else if (data.submissionType === "file" && data.fileUrl) {
      await onSubmit("file", data.fileUrl);
    }
    handleClose();
  }

  function handleClose() {
    resetForm();
    setSelectedFile(null);
    resetUpload();
    onClose();
  }

  const isSubmitDisabled =
    isSubmitting ||
    isUploading ||
    (submissionType === "link" && !deploymentUrl) ||
    (submissionType === "file" && !fileUrl);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg bg-secondary border-border w-full overflow-hidden">
        <form
          onSubmit={handleSubmit(onSubmitForm)}
          className="w-full overflow-hidden"
        >
          <DialogHeader className="w-full overflow-hidden">
            <DialogTitle className="text-white truncate">
              Submit Work for Review
            </DialogTitle>
            <DialogDescription className="text-secondary-foreground break-all whitespace-normal">
              Submit your completed work for &quot;{milestone.title}&quot; to
              request client approval and release of funds.
            </DialogDescription>
          </DialogHeader>

          {/* Submission Type Selection */}
          {!submissionType && (
            <div className="py-4 space-y-4">
              <p className="text-sm text-secondary-foreground">
                How would you like to submit your work?
              </p>
              <div className="grid gap-3">
                <button
                  onClick={() => setValue("submissionType", "link")}
                  className="flex items-center gap-4 p-4 text-left transition-colors border rounded-lg border-border bg-background hover:border-primary hover:bg-primary/5"
                >
                  <div className="flex items-center justify-center rounded-lg size-12 bg-primary/20 shrink-0">
                    <LinkIcon className="size-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Deployment Link</p>
                    <p className="text-sm text-secondary-foreground">
                      Submit a live URL from Vercel, Netlify, or any hosting
                      platform
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setValue("submissionType", "file")}
                  className="flex items-center gap-4 p-4 text-left transition-colors border rounded-lg border-border bg-background hover:border-primary hover:bg-primary/5"
                >
                  <div className="flex items-center justify-center rounded-lg size-12 bg-accent/20 shrink-0">
                    <FileArchive className="size-6 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Upload ZIP File</p>
                    <p className="text-sm text-secondary-foreground">
                      Upload a compressed archive of your deliverables (max
                      25MB)
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Deployment Link Input */}
          {submissionType === "link" && (
            <div className="py-4 space-y-4 w-full">
              <button
                onClick={() => setValue("submissionType", null)}
                className="flex items-center gap-1 text-sm text-secondary-foreground hover:text-white"
              >
                <X className="size-3" /> Change submission type
              </button>

              <div className="space-y-2 w-full">
                <Label
                  htmlFor="deploymentUrl"
                  className="text-secondary-foreground"
                >
                  Deployment URL
                </Label>
                <Input
                  id="deploymentUrl"
                  type="url"
                  placeholder="https://your-project.vercel.app"
                  {...register("deploymentUrl")}
                  className="text-white border-border bg-background placeholder:text-secondary-foreground/50 w-full"
                />
                <p className="text-xs text-secondary-foreground">
                  Provide the live deployment URL where your client can review
                  the work
                </p>
              </div>

              {errors.deploymentUrl && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="size-4" />
                  {errors.deploymentUrl.message}
                </div>
              )}
            </div>
          )}

          {/* File Upload */}
          {submissionType === "file" && (
            <div className="py-4 space-y-4 w-full overflow-hidden">
              <button
                onClick={() => setValue("submissionType", null)}
                className="flex items-center gap-1 text-sm text-secondary-foreground hover:text-white"
              >
                <X className="size-3" /> Change submission type
              </button>

              {!fileUrl ? (
                <>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-8 text-center transition-colors border-2 border-dashed rounded-lg cursor-pointer border-border bg-background hover:border-primary hover:bg-primary/5 w-full overflow-hidden"
                  >
                    <Upload className="mx-auto mb-3 size-10 text-secondary-foreground" />
                    <p className="text-sm text-white truncate px-2">
                      {selectedFile
                        ? selectedFile.name
                        : "Click to select a ZIP file"}
                    </p>
                    <p className="mt-1 text-xs text-secondary-foreground">
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
                    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 p-3 border rounded-lg border-border bg-background w-full overflow-hidden">
                      <FileArchive className="size-5 text-accent shrink-0" />
                      <div className="min-w-0 w-full overflow-hidden">
                        <p
                          className="text-sm text-white truncate w-full"
                          title={selectedFile.name}
                        >
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-secondary-foreground">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        onClick={handleUploadFile}
                        size="sm"
                        className="text-white shrink-0 bg-primary/80 hover:bg-primary"
                      >
                        Upload
                      </Button>
                    </div>
                  )}

                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-secondary-foreground">
                          Uploading...
                        </span>
                        <span className="text-white">{uploadProgress}%</span>
                      </div>
                      <Progress
                        value={uploadProgress}
                        className="h-2 bg-border"
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 border rounded-lg border-accent/30 bg-accent/10 w-full overflow-hidden">
                  <div className="grid grid-cols-[auto_1fr] items-center w-full gap-3">
                    <CheckCircle2 className="size-5 text-accent shrink-0" />
                    <div className="w-full min-w-0 overflow-hidden">
                      <p className="text-sm font-medium text-white truncate">
                        File uploaded successfully
                      </p>
                      <p
                        className="mt-1 text-xs text-secondary-foreground truncate w-full"
                        title={fileUrl}
                      >
                        {fileUrl}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(errors.fileUrl || uploadError) && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="size-4" />
                  {errors.fileUrl?.message || uploadError?.message}
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          {submissionType && (
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-border text-secondary-foreground hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitDisabled}
                className="text-white bg-primary/80 hover:bg-primary"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit for Review"
                )}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
