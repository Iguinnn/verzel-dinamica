"use client";

import { SearchIcon } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

type HistorySearchProps = {
  value: string;
  onValueChange: (value: string) => void;
};

/** Busca por placa ou setor na listagem de reservas. */
export function HistorySearch({ value, onValueChange }: HistorySearchProps) {
  return (
    <InputGroup className="sm:w-72">
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput
        placeholder="Buscar placa ou setor..."
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      />
    </InputGroup>
  );
}
