"use client";

import {
  apiErrorSchema,
  sectorListResponseSchema,
  type Sector,
} from "@parking/contracts";
import * as React from "react";

import { PageHeader } from "@/components/common/page-header";
import { PageShell } from "@/components/common/page-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SectorListState =
  | { status: "loading" }
  | { status: "success"; sectors: Sector[] }
  | { status: "error"; message: string };

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

async function fetchSectors(signal: AbortSignal): Promise<Sector[]> {
  const response = await fetch("/api/sectors", {
    headers: { accept: "application/json" },
    cache: "no-store",
    signal,
  });
  const payload: unknown = await response.json().catch(() => undefined);

  if (!response.ok) {
    const error = apiErrorSchema.safeParse(payload);
    throw new Error(
      error.success
        ? error.data.error.message
        : "The sector service returned an invalid response.",
    );
  }

  const result = sectorListResponseSchema.safeParse(payload);
  if (!result.success) {
    throw new Error("The sector service returned an invalid response.");
  }

  return result.data.data;
}

function sectorErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "An unexpected error occurred while loading sectors.";
}

function loadingState() {
  return (
    <Card aria-busy="true" aria-label="Loading sectors">
      <CardHeader>
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

function emptyState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>No sectors found</CardTitle>
        <CardDescription>
          Sectors registered by an administrator will appear here.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function errorState(message: string, onRetry: () => void) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Could not load sectors</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button type="button" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      </CardFooter>
    </Card>
  );
}

function sectorTable(sectors: Sector[]) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Available sectors</CardTitle>
        <CardDescription>
          {sectors.length} {sectors.length === 1 ? "sector" : "sectors"} in the
          parking lot.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sector</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead className="text-right">Hourly rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sectors.map((sector) => (
              <TableRow key={sector.id}>
                <TableCell className="font-medium">{sector.name}</TableCell>
                <TableCell>{sector.location}</TableCell>
                <TableCell>
                  {sector.availableSpots} of {sector.capacity} spots
                </TableCell>
                <TableCell className="text-right">
                  {currencyFormatter.format(sector.hourlyRate)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/** Listing screen for the parking sectors. */
export function SectorsView() {
  const [state, setState] = React.useState<SectorListState>({
    status: "loading",
  });
  const [requestId, setRequestId] = React.useState(0);

  React.useEffect(() => {
    const controller = new AbortController();

    void fetchSectors(controller.signal).then(
      (sectors) => setState({ status: "success", sectors }),
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setState({ status: "error", message: sectorErrorMessage(error) });
        }
      },
    );

    return () => controller.abort();
  }, [requestId]);

  let content: React.ReactNode;
  if (state.status === "loading") {
    content = loadingState();
  } else if (state.status === "error") {
    content = errorState(state.message, () => {
      setState({ status: "loading" });
      setRequestId((current) => current + 1);
    });
  } else if (state.sectors.length === 0) {
    content = emptyState();
  } else {
    content = sectorTable(state.sectors);
  }

  return (
    <PageShell>
      <PageHeader
        title="Sectors"
        description="Registration, availability and hourly rate per sector."
      />
      {content}
    </PageShell>
  );
}
