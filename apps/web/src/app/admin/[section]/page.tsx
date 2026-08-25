import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const sections = {
  setores: ["Setores", "Cadastro, disponibilidade e tarifa por setor."],
  reservas: ["Reservas", "Reservas ativas, canceladas e futuras."],
  "lista-de-espera": [
    "Lista de espera",
    "Ordem de entrada e promocoes por setor.",
  ],
  ranking: ["Ranking", "Setores ordenados pela quantidade de reservas."],
  usuarios: ["Usuarios", "Motoristas e administradores cadastrados."],
} as const;

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const content = sections[section as keyof typeof sections];

  if (!content) {
    notFound();
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{content[0]}</h1>
        <p className="text-sm text-muted-foreground">{content[1]}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Contrato preparado</CardTitle>
          <CardDescription>
            Esta rota esta pronta para a historia correspondente ser
            desenvolvida em paralelo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary">Setup inicial</Badge>
        </CardContent>
      </Card>
    </main>
  );
}
