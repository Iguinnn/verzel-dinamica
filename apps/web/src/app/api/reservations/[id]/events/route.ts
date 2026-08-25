import {
  listReservationEvents,
  reservationApiErrorResponse,
} from "@/lib/server/reservations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return Response.json(await listReservationEvents(id));
  } catch (error) {
    return reservationApiErrorResponse(error);
  }
}
