"use client";

import { EllipsisVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Sector } from "@/modules/sector-management/types";

/** Ações por linha da listagem. Ambas passam por confirmação antes de aplicar. */
export function SectorRowActions({
  sector,
  onEdit,
  onDelete,
}: {
  sector: Sector;
  onEdit: (sector: Sector) => void;
  onDelete: (sector: Sector) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Ações do ${sector.name}`}
          />
        }
      >
        <EllipsisVerticalIcon />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(sector)}>
          <PencilIcon />
          Editar
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" onClick={() => onDelete(sector)}>
          <Trash2Icon />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
