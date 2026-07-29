"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, UploadCloud } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // State to hold the securely fetched User ID
  const [userId, setUserId] = useState<string | null>(null);

  // 1. On page load, verify the user is actually logged in
  useEffect(() => {
    async function checkUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        // If they aren't logged in, kick them back to the login page
        router.push("/login");
      } else {
        // If they are, store their secure ID
        setUserId(session.user.id);
      }
    }
    checkUser();
  }, [router]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage({ text: "Please select a file first.", type: "error" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // 2. CRITICAL STEP: Attach the secure user ID to the Python payload
      if (userId) {
        formData.append("user_id", userId);
      } else {
        throw new Error("User not authenticated. Please log in again.");
      }

      // 3. Send to FastAPI Engine
      const response = await fetch(
        "http://127.0.0.1:8000/api/upload-trackman",
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Upload failed");
      }

      const data = await response.json();
      setMessage({
        text: data.message || "File processed successfully!",
        type: "success",
      });

      setFile(null); // Clear the file input

      // Auto-redirect to dashboard after 2 seconds to see the new data
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (error: any) {
      setMessage({ text: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header Section */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Data Ingestion Engine
          </h1>
          <p className="text-muted-foreground mt-2">
            Upload your Trackman CSV files here. All parsed pitches will be
            securely tied to your specific account.
          </p>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle>Upload Trackman CSV</CardTitle>
            <CardDescription>
              Select a valid Trackman pitch data file.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="grid w-full items-center gap-1.5">
                <input
                  id="trackman-file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                />
              </div>

              {message && (
                <div
                  className={`text-sm font-medium p-3 rounded-md ${
                    message.type === "success"
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : "bg-red-50 text-red-600 border border-red-200"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={!file || loading}
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-900/90 disabled:pointer-events-none disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UploadCloud className="mr-2 h-4 w-4" />
                )}
                {loading
                  ? "Processing via Python Engine..."
                  : "Upload & Analyze"}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
