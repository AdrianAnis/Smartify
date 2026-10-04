import { NextRequest, NextResponse } from "next/server";
import { requireQuizOwner } from "@/lib/quiz/quiz-owner";
import { openWaitingRoom } from "@/lib/classroom/session";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const owner = await requireQuizOwner(request, id);
    if (!owner.ok) return owner.response;

    if (owner.kuis.status !== "published") {
      return NextResponse.json(
        { error: "Kuis harus berstatus published untuk membuka ruang tunggu." },
        { status: 409 },
      );
    }

    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const { qrToken } = await openWaitingRoom(owner.kuis.kuis_id);
    const joinUrl = `${appUrl}/join/${qrToken}`;

    return NextResponse.json({ qrToken, joinUrl });
  } catch (error) {
    console.error("Open waiting room error:", error);
    return NextResponse.json(
      { error: "Gagal membuka ruang tunggu" },
      { status: 500 },
    );
  }
}
