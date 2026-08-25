"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getOccupiedSpots } from "@/modules/sector-management/sector-status";
import {
  toSectorDraft,
  validateSectorDraft,
} from "@/modules/sector-management/sector-form";
import {
  emptySectorDraft,
  type Sector,
  type SectorDraft,
  type SectorDraftErrors,
} from "@/modules/sector-management/types";

type Field = {
  name: keyof SectorDraft;
  label: string;
  placeholder: string;
  inputMode?: "numeric" | "decimal";
};

const fields: Field[] = [
  { name: "name", label: "Nome", placeholder: "Setor D - Coberto" },
  { name: "location", label: "Localização", placeholder: "Subsolo 2" },
  {
    name: "capacity",
    label: "Cota de vagas reserváveis",
    placeholder: "120",
    inputMode: "numeric",
  },
  {
    name: "hourlyRate",
    label: "Tarifa por hora (R$)",
    placeholder: "12,50",
    inputMode: "decimal",
  },
];

type SectorFormDialogProps = {
  onOpenChange: (open: boolean) => void;
  /** Ausente cadastra um setor; presente edita o setor informado. */
  sector?: Sector;
  onSubmit: (draft: SectorDraft) => void;
};

/**
 * Formulário de cadastro e edição de setor.
 *
 * Montado apenas enquanto aberto, de modo que cada abertura começa com o
 * formulário limpo sem precisar sincronizar estado por efeito.
 */
export function SectorFormDialog({
  onOpenChange,
  sector,
  onSubmit,
}: SectorFormDialogProps) {
  const isEditing = sector !== undefined;
  const [draft, setDraft] = React.useState<SectorDraft>(() =>
    sector ? toSectorDraft(sector) : emptySectorDraft,
  );
  const [errors, setErrors] = React.useState<SectorDraftErrors>({});

  function handleChange(field: keyof SectorDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    // Limpa o erro do campo assim que o operador começa a corrigi-lo.
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateSectorDraft(draft, {
      minimumCapacity: sector ? getOccupiedSpots(sector) : 1,
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit(draft);
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Setor" : "Novo Setor"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Altere os dados do setor. As vagas já ocupadas são preservadas."
              : "Cadastre um setor com nome, localização, cota de vagas e tarifa por hora."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="sector-form"
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          {fields.map((field) => {
            const error = errors[field.name];
            const errorId = `${field.name}-error`;

            return (
              <div key={field.name} className="flex flex-col gap-2">
                <Label htmlFor={field.name}>{field.label}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={draft[field.name]}
                  placeholder={field.placeholder}
                  inputMode={field.inputMode}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? errorId : undefined}
                  onChange={(event) =>
                    handleChange(field.name, event.target.value)
                  }
                />
                {error ? (
                  <p
                    id={errorId}
                    role="alert"
                    className="text-xs text-destructive"
                  >
                    {error}
                  </p>
                ) : null}
              </div>
            );
          })}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="sector-form">
            {isEditing ? "Salvar alterações" : "Cadastrar setor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
