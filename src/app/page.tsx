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
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

const PITCH_COLORS: Record<string, string> = {
  Fastball: "#ef4444", // Red
  "Four-Seam": "#ef4444",
  FF: "#ef4444",
  Sinker: "#f97316", // Orange
  "Two-Seam": "#f97316",
  SI: "#f97316",
  Slider: "#eab308", // Yellow
  SL: "#eab308",
  Curveball: "#3b82f6", // Blue
  CB: "#3b82f6",
  Changeup: "#22c55e",
  ChangeUp: "#22c55e", // Green
  CH: "#22c55e",
  Splitter: "#14b8a6", // Teal
  FS: "#14b8a6",
  Cutter: "#a855f7", // Purple
  FC: "#a855f7",
};

const getPitchColor = (pitchType: string) =>
  PITCH_COLORS[pitchType] || "#94a3b8"; // Default slate

export default function DashboardPage() {
  const [pitches, setPitches] = useState<any[]>([]);
  const [pitchCount, setPitchCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  // --- NEW: Pitcher Filtering Logic ---
  const [selectedPitcher, setSelectedPitcher] = useState<string>("All");

  // Extract a list of unique pitcher names from the data
  const uniquePitchers = Array.from(
    new Set(pitches.map((p) => p.pitcher_name).filter(Boolean)),
  );

  // Filter the data based on the dropdown selection
  const displayPitches =
    selectedPitcher === "All"
      ? pitches
      : pitches.filter((p) => p.pitcher_name === selectedPitcher);

  // --- ADVANCED SAVANT-STYLE AGGREGATION MATH ---
  const arsenalStats = displayPitches.reduce(
    (acc, pitch) => {
      const type = pitch.pitch_type || "Unknown";
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          veloSum: 0,
          stuffSum: 0,
          hardHit: 0,
          bip: 0,
          strikeouts: 0,
          swings: 0,
          whiffs: 0,
          csw: 0,
          launchAngleSum: 0,
          exitVeloSum: 0,
        };
      }

      acc[type].count += 1;
      if (pitch.rel_speed) acc[type].veloSum += pitch.rel_speed;
      if (pitch.stuff_plus) acc[type].stuffSum += pitch.stuff_plus;

      // Outcomes & Counts
      if (pitch.play_result === "Strikeout") acc[type].strikeouts += 1;

      // Pitch Call logic for Whiff & CSW
      const call = pitch.pitch_call ? pitch.pitch_call.toLowerCase() : "";
      const isStrikeCall =
        call.includes("strike") ||
        call.includes("called") ||
        call.includes("foul") ||
        call.includes("inplay");
      const isWhiff =
        call.includes("swingingstrike") || call.includes("strikeswinging");
      const isCalledStrike =
        call.includes("strikecalled") || call.includes("calledstrike");

      // Track swings (Swinging strike or foul or in play)
      if (isWhiff || call.includes("foul") || call.includes("inplay")) {
        acc[type].swings += 1;
      }
      if (isWhiff) {
        acc[type].whiffs += 1;
      }

      // CSW calculation (Called strikes + Whiffs)
      if (isCalledStrike || isWhiff) {
        acc[type].csw += 1;
      }

      // Batted Ball Profile (Exit Velo & Launch Angle)
      if (pitch.exit_velocity > 0) {
        acc[type].bip += 1;
        acc[type].exitVeloSum += pitch.exit_velocity;
        if (pitch.exit_velocity >= 95.0) acc[type].hardHit += 1;
      }
      if (pitch.launch_angle !== null && pitch.launch_angle !== undefined) {
        acc[type].launchAngleSum += pitch.launch_angle;
      }

      return acc;
    },
    {} as Record<string, any>,
  );

  const arsenalArray = Object.keys(arsenalStats)
    .map((type) => {
      const stats = arsenalStats[type];
      return {
        type,
        usage: (stats.count / displayPitches.length) * 100,
        count: stats.count,
        avgVelo: stats.count > 0 ? stats.veloSum / stats.count : 0,
        avgStuff: stats.count > 0 ? stats.stuffSum / stats.count : 0,
        whiffRate: stats.swings > 0 ? (stats.whiffs / stats.swings) * 100 : 0,
        cswRate: stats.count > 0 ? (stats.csw / stats.count) * 100 : 0,
        hardHitRate: stats.bip > 0 ? (stats.hardHit / stats.bip) * 100 : 0,
        avgExitVelo: stats.bip > 0 ? stats.exitVeloSum / stats.bip : 0,
        avgLaunchAngle: stats.bip > 0 ? stats.launchAngleSum / stats.bip : 0,
        strikeouts: stats.strikeouts,
        bip: stats.bip,
      };
    })
    .sort((a, b) => b.usage - a.usage);
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // --- NEW: Securely identify the logged-in user ---
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return; // Stop if not logged in
        const userId = session.user.id;

        // 1. Fetch total count of pitches for THIS user only
        const { count, error: countError } = await supabase
          .from("pitches")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId); // <-- SECURITY FILTER ADDED

        if (countError) throw countError;
        if (count !== null) setPitchCount(count);

        // 2. Fetch the most recent pitches for THIS user only
        const { data, error: fetchError } = await supabase
          .from("pitches")
          .select(
            "pitch_type, rel_speed, spin_rate, induced_vert_break, horz_break, play_result, stuff_plus, pitcher_name, exit_velocity, pitch_call, launch_angle",
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(2000);

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
        {/* --- NEW: ROSTER FILTER --- */}
        <div className="flex items-center justify-between bg-card border border-slate-900 p-4 rounded-lg">
          <div>
            <h3 className="font-semibold text-base">Roster Filter</h3>
            <p className="text-sm text-muted-foreground">
              Isolate metrics by specific athlete.
            </p>
          </div>
          <select
            value={selectedPitcher}
            onChange={(e) => setSelectedPitcher(e.target.value)}
            className="h-10 rounded-md border border-slate-300 bg-white text-gray-900 px-3 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="All">All Pitchers (Team View)</option>
            {uniquePitchers.map((pitcher, idx) => (
              <option key={idx} value={pitcher as string}>
                {pitcher as string}
              </option>
            ))}
          </select>
        </div>
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
                Highest Stuff+ (Recent)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {loading || displayPitches.length === 0
                  ? "--"
                  : Math.max(
                      ...displayPitches.map((p) => p.stuff_plus || 0),
                    ).toFixed(1)}
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
                className={`text-xl font-bold ${displayPitches.length > 0 ? "text-emerald-500" : "text-amber-500"}`}
              >
                {loading
                  ? "Syncing..."
                  : displayPitches.length > 0
                    ? "Online & Synced"
                    : "Awaiting Data"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- INTERACTIVE PITCH CHART (SQUARE & PITCHER'S VIEW) --- */}
        <Card className="max-w-3xl mx-auto w-full">
          <CardHeader>
            <CardTitle>Pitch Movement (HB vs IVB)</CardTitle>
            <CardDescription>
              Pitcher's perspective. Measured in inches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="aspect-square w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : displayPitches.length === 0 ? (
              <div className="aspect-square w-full flex items-center justify-center text-muted-foreground">
                No pitch data available.
              </div>
            ) : (
              // Using aspect-square to force a perfect 1:1 box
              <div className="aspect-square w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    margin={{ top: 20, right: 20, bottom: 20, left: -10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />

                    {/* The X Axis (reversed={true} removed for Pitcher's Perspective) */}
                    <XAxis
                      type="number"
                      dataKey="horz_break"
                      name="Horizontal Break"
                      unit=" in"
                      domain={[-25, 25]}
                      tickCount={11}
                    />
                    <YAxis
                      type="number"
                      dataKey="induced_vert_break"
                      name="Induced Vertical Break"
                      unit=" in"
                      domain={[-25, 30]}
                      tickCount={12}
                    />

                    {/* Center Crosshairs */}
                    <ReferenceLine x={0} stroke="#ffffff" opacity={0.5} />
                    <ReferenceLine y={0} stroke="#ffffff" opacity={0.5} />

                    {/* The Enhanced Hover Tooltip */}
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 border border-slate-200 p-4 rounded-md shadow-lg text-sm min-w-[160px]">
                              <p className="font-bold text-lg border-b pb-2 mb-2">
                                {data.pitch_type || "Unknown"}
                              </p>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                <span className="text-slate-500 font-medium">
                                  Stuff+
                                </span>
                                <span className="font-bold text-blue-600 text-right">
                                  {data.stuff_plus?.toFixed(1) || "--"}
                                </span>

                                <span className="text-slate-500 font-medium">
                                  Velo
                                </span>
                                <span className="font-semibold text-right">
                                  {data.rel_speed?.toFixed(1)} mph
                                </span>

                                <span className="text-slate-500 font-medium">
                                  IVB
                                </span>
                                <span className="font-semibold text-right">
                                  {data.induced_vert_break?.toFixed(1)}"
                                </span>

                                <span className="text-slate-500 font-medium">
                                  HB
                                </span>
                                <span className="font-semibold text-right">
                                  {data.horz_break?.toFixed(1)}"
                                </span>

                                <span className="text-slate-500 font-medium">
                                  Spin
                                </span>
                                <span className="font-semibold text-right">
                                  {data.spin_rate?.toFixed(0) || "--"} rpm
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />

                    {/* Plotting the Dots */}
                    <Scatter data={displayPitches} name="Pitches">
                      {displayPitches.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getPitchColor(entry.pitch_type)}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* --- NEW: ADVANCED SAVANT PROFILE CARD --- */}
        {selectedPitcher !== "All" && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle>Advanced Metrics Profile: {selectedPitcher}</CardTitle>
              <CardDescription>
                Pitch-level command, whiff metrics, and batted ball quality.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pitch</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Velo</TableHead>
                    <TableHead>Stuff+</TableHead>
                    <TableHead>Whiff%</TableHead>
                    <TableHead>CSW%</TableHead>
                    <TableHead>Avg EV</TableHead>
                    <TableHead className="text-right">Hard-Hit%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {arsenalArray.map((pitch) => (
                    <TableRow key={pitch.type}>
                      <TableCell className="font-bold flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getPitchColor(pitch.type) }}
                        ></div>
                        {pitch.type}
                      </TableCell>
                      <TableCell>{pitch.usage.toFixed(1)}%</TableCell>
                      <TableCell className="font-medium">
                        {pitch.avgVelo.toFixed(1)}
                      </TableCell>
                      <TableCell
                        className={`font-semibold ${
                          pitch.avgStuff >= 110
                            ? "text-blue-600"
                            : "text-slate-700"
                        }`}
                      >
                        {pitch.avgStuff.toFixed(1)}
                      </TableCell>
                      <TableCell
                        className={`font-bold ${
                          pitch.whiffRate >= 30
                            ? "text-emerald-600"
                            : "text-slate-700"
                        }`}
                      >
                        {pitch.whiffRate.toFixed(1)}%
                      </TableCell>
                      <TableCell
                        className={`font-bold ${
                          pitch.cswRate >= 30
                            ? "text-emerald-600"
                            : "text-slate-700"
                        }`}
                      >
                        {pitch.cswRate.toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        {pitch.bip > 0
                          ? `${pitch.avgExitVelo.toFixed(1)} mph`
                          : "--"}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${
                          pitch.hardHitRate > 40 && pitch.bip > 0
                            ? "text-red-500"
                            : "text-slate-700"
                        }`}
                      >
                        {pitch.bip > 0
                          ? `${pitch.hardHitRate.toFixed(1)}%`
                          : "--"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

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
            ) : displayPitches.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                No pitches found. Upload a CSV to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pitch</TableHead>
                    <TableHead>Stuff+</TableHead>
                    <TableHead>Velo (mph)</TableHead>
                    <TableHead>Spin (rpm)</TableHead>
                    <TableHead>IVB (in)</TableHead>
                    <TableHead>HB (in)</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayPitches.map((pitch, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {pitch.pitch_type || "Unknown"}
                      </TableCell>
                      <TableCell className="font-bold text-blue-600">
                        {pitch.stuff_plus ? pitch.stuff_plus.toFixed(1) : "--"}
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
