import {
  sectorIdSchema,
  sectorResponseSchema,
  updateSectorSchema,
} from "@parking/contracts";

import {
  deleteSector,
  getSector,
  sectorApiErrorResponse,
  updateSector,
} from "@/lib/server/sectors";

type SectorRouteContext = {
  params: Promise<{ id: string }>;
};

async function sectorId(context: SectorRouteContext) {
  const { id } = await context.params;
  return sectorIdSchema.safeParse(id);
}

function invalidIdResponse(message: string | undefined): Response {
  return Response.json(
    {
      error: {
        code: "INVALID_SECTOR_ID",
        message: message ?? "Identificador de setor invalido.",
      },
    },
    { status: 400 },
  );
}

export async function GET(_request: Request, context: SectorRouteContext) {
  const id = await sectorId(context);

  if (!id.success) {
    return invalidIdResponse(id.error.issues[0]?.message);
  }

  try {
    const sector = await getSector(id.data);
    return Response.json(sectorResponseSchema.parse({ data: sector }));
  } catch (error) {
    return sectorApiErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: SectorRouteContext) {
  const id = await sectorId(context);

  if (!id.success) {
    return invalidIdResponse(id.error.issues[0]?.message);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: { code: "INVALID_JSON", message: "Corpo JSON invalido." } },
      { status: 400 },
    );
  }

  const input = updateSectorSchema.safeParse(body);

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
    const sector = await updateSector(id.data, input.data);
    return Response.json(sectorResponseSchema.parse({ data: sector }));
  } catch (error) {
    return sectorApiErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: SectorRouteContext) {
  const id = await sectorId(context);

  if (!id.success) {
    return invalidIdResponse(id.error.issues[0]?.message);
  }

  try {
    await deleteSector(id.data);
    return new Response(null, { status: 204 });
  } catch (error) {
    return sectorApiErrorResponse(error);
  }
}
