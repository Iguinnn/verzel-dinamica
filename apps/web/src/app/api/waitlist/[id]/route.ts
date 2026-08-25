import { waitlistEntryIdSchema } from "@parking/contracts";

import {
  leaveWaitlist,
  waitlistApiErrorResponse,
} from "@/lib/server/waitlist";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const entryId = waitlistEntryIdSchema.safeParse(id);

  if (!entryId.success) {
    return Response.json(
      {
        error: {
          code: "INVALID_WAITLIST_ENTRY_ID",
          message:
            entryId.error.issues[0]?.message ??
            "Identificador da entrada na fila invalido.",
        },
      },
      { status: 400 },
    );
  }

  try {
    await leaveWaitlist(entryId.data);
    return new Response(null, { status: 204 });
  } catch (error) {
    return waitlistApiErrorResponse(error);
  }
}
