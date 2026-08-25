import { listSectors } from "@/lib/server/sectors";

export async function GET() {
  try {
    return Response.json(await listSectors());
  } catch {
    return Response.json(
      {
        error: {
          code: "SECTORS_UNAVAILABLE",
          message: "Nao foi possivel carregar os setores.",
        },
      },
      { status: 502 },
    );
  }
}
