import { createSectorSchema, sectorResponseSchema } from "@parking/contracts";

import {
  createSector,
  listSectors,
  sectorApiErrorResponse,
} from "@/lib/server/sectors";

export async function GET(request: Request) {
  try {
    return Response.json(await listSectors(request.headers.get("cookie")));
  } catch (error) {
    return sectorApiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: { code: "INVALID_JSON", message: "Corpo JSON invalido." } },
      { status: 400 },
    );
  }

  const input = createSectorSchema.safeParse(body);

  if (!input.success) {
    return Response.json(
      {
        error: {
          code: "INVALID_SECTOR",
          message: input.error.issues[0]?.message ?? "Dados do setor invalidos.",
        },
      },
      { status: 400 },
    );
  }

  try {
    const sector = await createSector(input.data);
    return Response.json(sectorResponseSchema.parse({ data: sector }), {
      status: 201,
    });
  } catch (error) {
    return sectorApiErrorResponse(error);
  }
}
