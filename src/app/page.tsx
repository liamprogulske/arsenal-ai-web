"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [pitches, setPitches] = useState<any[]>([]);
  const [pitchCount, setPitchCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // 1. Fetch total count of pitches in the database
        const { count, error: countError } = await supabase
          .from("pitches")
          .select("*", { count: "exact", head: true });

        if (countError) throw countError;
        if (count !== null) setPitchCount(count);

        // 2. Fetch the 10 most recent pitches to populate the table
        const { data, error: fetchError } = await supabase
          .from("pitches")
          .select(
            "pitch_type, rel_speed, spin_rate, induced_vert_break, horz_break, play_result",
          )
          .order("created_at", { ascending: false })
          .limit(10);

        if (fetchError) throw fetchError;
        if (data) setPitches(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            System Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Live feed of recent pitch data ingested from the Python processing
            engine.
          </p>
        </div>

        <Separator />

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Pitches Tracked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  pitchCount
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Highest Velo (Recent)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loading || pitches.length === 0
                  ? "--"
                  : Math.max(...pitches.map((p) => p.rel_speed || 0)).toFixed(
                      1,
                    )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Database Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-xl font-bold ${pitches.length > 0 ? "text-emerald-500" : "text-amber-500"}`}
              >
                {loading
                  ? "Syncing..."
                  : pitches.length > 0
                    ? "Online & Synced"
                    : "Awaiting Data"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Pitches Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Pitches Feed</CardTitle>
            <CardDescription>
              The latest metrics parsed and normalized in your Supabase
              database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : pitches.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                No pitches found. Upload a CSV to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pitch</TableHead>
                    <TableHead>Velo (mph)</TableHead>
                    <TableHead>Spin (rpm)</TableHead>
                    <TableHead>IVB (in)</TableHead>
                    <TableHead>HB (in)</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pitches.map((pitch, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {pitch.pitch_type || "Unknown"}
                      </TableCell>
                      <TableCell className="text-emerald-500 font-semibold">
                        {pitch.rel_speed?.toFixed(1) || "--"}
                      </TableCell>
                      <TableCell>
                        {pitch.spin_rate?.toFixed(0) || "--"}
                      </TableCell>
                      <TableCell>
                        {pitch.induced_vert_break?.toFixed(1) || "--"}
                      </TableCell>
                      <TableCell>
                        {pitch.horz_break?.toFixed(1) || "--"}
                      </TableCell>
                      <TableCell className="capitalize">
                        {pitch.play_result || "--"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
