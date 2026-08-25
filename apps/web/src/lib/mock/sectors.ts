import type { Sector } from "@parking/contracts";

/**
 * Setores usados pelas telas ainda não integradas.
 *
 * Fixture compartilhado entre módulos: gestão de setores e lista de espera
 * precisam enxergar o mesmo pátio. Módulos não importam uns dos outros, então
 * dados comuns vivem aqui.
 *
 * TODO(backend): substituir por `listSectors()` quando a API existir.
 */
export const mockSectors: Sector[] = [
  {
    id: "a4d1f2c0-1f2a-4c3b-9d5e-6f7a8b9c0d1e",
    name: "Setor A - VIP",
    location: "Térreo Central",
    capacity: 100,
    availableSpots: 55,
    hourlyRate: 15,
  },
  {
    id: "b5e2a3d1-2a3b-4d4c-8e6f-7a8b9c0d1e2f",
    name: "Setor B - Coberto",
    location: "Subsolo 1",
    capacity: 200,
    availableSpots: 30,
    hourlyRate: 10,
  },
  {
    id: "c6f3b4e2-3b4c-4e5d-9f7a-8b9c0d1e2f3a",
    name: "Setor C - Descoberto",
    location: "Pátio Externo",
    capacity: 300,
    availableSpots: 0,
    hourlyRate: 5,
  },
];
