import { LogOutIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
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
import { formatDateTime } from "@/lib/format";
import type { SectorQueue, WaitlistEntry } from "@/modules/waitlist/types";

/**
 * Fila de um setor, na ordem de entrada.
 *
 * Posição, mascaramento de placa e `isMine` vêm da API — a tela só renderiza.
 * Sair da fila só aparece nas entradas do próprio motorista.
 */
export function SectorWaitlistCard({
  queue,
  onLeave,
}: {
  queue: SectorQueue;
  onLeave: (entry: WaitlistEntry) => void;
}) {
  const { sector, entries } = queue;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{sector.name}</CardTitle>
        <CardDescription>{sector.location}</CardDescription>
        <CardAction>
          <Badge variant="secondary">
            {entries.length === 1 ? "1 na fila" : `${entries.length} na fila`}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent>
        {entries.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Ninguém na lista de espera deste setor.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-0">Posição</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead>Chegada prevista</TableHead>
                <TableHead>Entrada na fila</TableHead>
                <TableHead className="w-0 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {entry.position}º
                  </TableCell>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      {entry.maskedPlate}
                      {entry.isMine ? (
                        <Badge variant="outline">Você</Badge>
                      ) : null}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {formatDateTime(entry.expectedArrivalAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {formatDateTime(entry.joinedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.isMine ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onLeave(entry)}
                      >
                        <LogOutIcon data-icon="inline-start" />
                        Sair da fila
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
