import {
  CalendarCheckIcon,
  CircleParkingIcon,
  MapPinnedIcon,
  PlusIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";

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
import { listSectors } from "@/lib/server/sectors";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default async function AdminDashboardPage() {
  const { data: sectors } = await listSectors();
  const capacity = sectors.reduce((total, sector) => total + sector.capacity, 0);
  const availableSpots = sectors.reduce(
    (total, sector) => total + sector.availableSpots,
    0,
  );
  const occupiedSpots = capacity - availableSpots;
  const occupancyRate =
    capacity === 0 ? 0 : Math.round((occupiedSpots / capacity) * 100);

  const metrics = [
    {
      label: "Setores",
      value: sectors.length,
      description: "Areas configuradas",
      icon: MapPinnedIcon,
    },
    {
      label: "Vagas reservaveis",
      value: capacity,
      description: "Capacidade total",
      icon: CircleParkingIcon,
    },
    {
      label: "Vagas disponiveis",
      value: availableSpots,
      description: "Cota atual",
      icon: CalendarCheckIcon,
    },
    {
      label: "Ocupacao",
      value: `${occupancyRate}%`,
      description: `${occupiedSpots} vagas reservadas`,
      icon: UsersIcon,
    },
  ];

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Visao geral</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe a disponibilidade atual do estacionamento.
          </p>
        </div>
        <Button render={<Link href="/admin/setores" />}>
          <PlusIcon data-icon="inline-start" />
          Novo setor
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardTitle>{metric.label}</CardTitle>
              <CardDescription>{metric.description}</CardDescription>
              <CardAction>
                <metric.icon className="size-4 text-muted-foreground" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">
                {metric.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Setores</CardTitle>
          <CardDescription>
            Dados recebidos pelo contrato compartilhado entre API e BFF.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Setor</TableHead>
                <TableHead>Localizacao</TableHead>
                <TableHead>Disponibilidade</TableHead>
                <TableHead>Tarifa</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sectors.map((sector) => (
                <TableRow key={sector.id}>
                  <TableCell className="font-medium">{sector.name}</TableCell>
                  <TableCell>{sector.location}</TableCell>
                  <TableCell>
                    {sector.availableSpots} de {sector.capacity}
                  </TableCell>
                  <TableCell>{currency.format(sector.hourlyRate)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        sector.availableSpots > 0 ? "secondary" : "outline"
                      }
                    >
                      {sector.availableSpots > 0 ? "Disponivel" : "Lotado"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
