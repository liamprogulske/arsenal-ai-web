import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function PitchersPage() {
  // Placeholder data - this will eventually be fetched from your Supabase database
  const pitchers = [
    {
      id: "1",
      name: "Liam Progulske",
      height: "6'3\"",
      weight: "230 lbs",
      throws: "R",
      topVelo: 94.2,
      arsenal: ["FB", "SL", "CH"],
      lastSession: "2026-07-16",
      facility: "TNXL Academy",
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Pitcher Profiles
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your roster and view individual biomechanical and trackman
              profiles.
            </p>
          </div>
          <Button>Add New Pitcher</Button>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name..."
              className="pl-8"
            />
          </div>
        </div>

        {/* Roster Table */}
        <Card>
          <CardHeader>
            <CardTitle>Active Roster</CardTitle>
            <CardDescription>
              Click on a row to view the full arsenal breakdown.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Athlete</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Frame</TableHead>
                  <TableHead>Top Velo</TableHead>
                  <TableHead>Arsenal</TableHead>
                  <TableHead>Last Session</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pitchers.map((pitcher) => (
                  <TableRow
                    key={pitcher.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {pitcher.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{pitcher.name}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {pitcher.facility}
                    </TableCell>
                    <TableCell>
                      {pitcher.height} / {pitcher.weight} / {pitcher.throws}HP
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-500">
                      {pitcher.topVelo} mph
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {pitcher.arsenal.map((pitch) => (
                          <Badge
                            key={pitch}
                            variant="secondary"
                            className="text-xs"
                          >
                            {pitch}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {pitcher.lastSession}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
