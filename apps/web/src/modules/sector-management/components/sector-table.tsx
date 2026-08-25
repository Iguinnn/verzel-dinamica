import { EllipsisVerticalIcon, ListFilterIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
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
import { formatHourlyRate } from "@/modules/sector-management/format";
import { getOccupiedSpots } from "@/modules/sector-management/sector-status";
import { SectorRowActions } from "@/modules/sector-management/components/sector-row-actions";
import { SectorStatusBadge } from "@/modules/sector-management/components/sector-status-badge";
import type { Sector } from "@/modules/sector-management/types";

/** Listagem dos setores cadastrados. */
export function SectorTable({
  sectors,
  onEdit,
  onDelete,
}: {
  sectors: Sector[];
  onEdit: (sector: Sector) => void;
  onDelete: (sector: Sector) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Setores Ativos</CardTitle>
        <CardAction className="flex items-center gap-1">
          {/* Fora do escopo da ESTC-1: mantidos como afordância visual. */}
          <Button variant="ghost" size="icon-sm" disabled aria-label="Filtrar">
            <ListFilterIcon />
          </Button>
          <Button variant="ghost" size="icon-sm" disabled aria-label="Mais opções">
            <EllipsisVerticalIcon />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Status (Lotação)</TableHead>
              <TableHead className="text-right">Vagas</TableHead>
              <TableHead className="text-right">Tarifa/Hora</TableHead>
              <TableHead className="w-0 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sectors.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  Nenhum setor cadastrado. Use “Novo Setor” para começar.
                </TableCell>
              </TableRow>
            ) : (
              sectors.map((sector) => (
                <TableRow key={sector.id}>
                  <TableCell className="font-medium">{sector.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {sector.location}
                  </TableCell>
                  <TableCell>
                    <SectorStatusBadge sector={sector} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {getOccupiedSpots(sector)} / {sector.capacity}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatHourlyRate(sector.hourlyRate)}
                  </TableCell>
                  <TableCell className="text-right">
                    <SectorRowActions
                      sector={sector}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
