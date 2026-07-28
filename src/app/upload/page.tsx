"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CloudUpload, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [trackingSystem, setTrackingSystem] = useState<string>("trackman");
  const [status, setStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      setStatus("error");
      setErrorMessage("Invalid file type. Please upload a raw CSV export.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setStatus("idle");
    setErrorMessage("");
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setStatus("uploading");
    setErrorMessage("");

    try {
      // 1. Package the file into a FormData object
      const formData = new FormData();
      formData.append("file", file);

      // Note: We can also append the trackingSystem here later if needed!
      // formData.append("tracking_system", trackingSystem);

      // 2. Send the POST request to your Python FastAPI server
      const response = await fetch(
        "http://localhost:8000/api/upload-trackman",
        {
          method: "POST",
          body: formData,
        },
      );

      // 3. Handle Python API errors
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to parse the CSV file.");
      }

      // 4. Success!
      setStatus("success");
    } catch (error: any) {
      console.error("Upload Error:", error);
      setStatus("error");
      setErrorMessage(
        error.message || "Could not connect to the processing engine.",
      );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Ingest Pitch Data
          </h1>
          <p className="text-muted-foreground mt-2">
            Upload raw CSV metrics from any major optical or radar tracking
            system.
          </p>
        </div>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Session Import</CardTitle>
            <CardDescription>
              Select your hardware and upload the corresponding CSV.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUploadSubmit} className="space-y-6">
              {/* Hardware Selector */}
              <div className="space-y-2">
                <Label htmlFor="system-select">Tracking System</Label>
                <Select
                  value={trackingSystem}
                  onValueChange={setTrackingSystem}
                >
                  <SelectTrigger id="system-select">
                    <SelectValue placeholder="Select tracking hardware" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trackman">Trackman</SelectItem>
                    <SelectItem value="rapsodo">Rapsodo</SelectItem>
                    <SelectItem value="yakkertech">Yakkertech</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dropzone Container */}
              <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center bg-card/30 hover:bg-card/50 transition-colors relative mt-4">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  disabled={status === "uploading"}
                />

                <CloudUpload className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-sm font-medium">
                  {file ? file.name : "Click to browse or drag & drop file"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supported formats: Raw .CSV data matrix only
                </p>
              </div>

              {/* Status Feedbacks */}
              {status === "error" && (
                <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {status === "success" && (
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-lg">
                  <CheckCircle2 size={18} className="shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">File successfully queued!</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Metrics are ready for the backend normalization pipeline.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Trigger */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!file || status === "uploading"}
                  className="w-full sm:w-auto"
                >
                  {status === "uploading" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Parsing Metrics...
                    </>
                  ) : (
                    "Process Session Data"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
