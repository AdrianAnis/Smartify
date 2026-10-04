import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { parseId, requireQuizOwner } from "@/lib/quiz/quiz-owner";
import {
  EDITABLE_STATUSES,
  loadQuestions,
  syncQuizAfterDelete,
} from "@/lib/quiz/questions";

type Ctx = RouteContext<"/api/quiz/[id]/questions/[soalId]">;

const LOCKED_MESSAGE =
  "Soal tidak bisa diubah karena kuis sudah dibuka untuk siswa.";

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function resolve(request: NextRequest, ctx: Ctx) {
  const { id, soalId } = await ctx.params;
  const owner = await requireQuizOwner(request, id);
  if (!owner.ok) return { response: owner.response };

  if (!EDITABLE_STATUSES.includes(owner.kuis.status)) {
    return { response: NextResponse.json({ error: LOCKED_MESSAGE }, { status: 409 }) };
  }

  const sid = parseId(soalId);
  const [soal] = sid ? await loadQuestions(owner.kuis.kuis_id, sid) : [];
  if (!soal) {
    return {
      response: NextResponse.json({ error: "Soal tidak ditemukan" }, { status: 404 }),
    };
  }

  return { kuisId: owner.kuis.kuis_id, soal };
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const resolved = await resolve(request, ctx);
    if ("response" in resolved) return resolved.response;
    const { soal } = resolved;

    const body = await request.json();
    const teksSoal = text(body.teks_soal);
    const topik = text(body.topik);
    const penjelasan = text(body.penjelasan);

    if (!teksSoal || teksSoal.length > 2000) {
      return badRequest("Teks soal wajib diisi (maksimal 2000 karakter)");
    }
    if (!topik || topik.length > 100) {
      return badRequest("Topik wajib diisi (maksimal 100 karakter)");
    }
    if (penjelasan.length > 2000) {
      return badRequest("Penjelasan maksimal 2000 karakter");
    }

    let jawabanText: string;
    let kataKunci: string[] = [];
    let pilihanUpdates: { pilihan_id: number; teks_pilihan: string; is_benar: boolean }[] = [];

    if (soal.tipe_soal === "pilihan_ganda") {
      const ids = new Set(soal.pilihan.map((p) => p.pilihan_id));
      const incoming: { pilihan_id: number; teks_pilihan: string }[] = Array.isArray(body.pilihan)
        ? body.pilihan.map((p: Record<string, unknown>) => ({
            pilihan_id: Number(p?.pilihan_id),
            teks_pilihan: text(p?.teks_pilihan),
          }))
        : [];
      const correctId = Number(body.correct_pilihan_id);

      if (incoming.length !== ids.size || incoming.some((p) => !ids.has(p.pilihan_id))) {
        return badRequest("Data pilihan jawaban tidak valid");
      }
      if (incoming.some((p) => !p.teks_pilihan || p.teks_pilihan.length > 500)) {
        return badRequest("Setiap pilihan wajib diisi (maksimal 500 karakter)");
      }
      if (new Set(incoming.map((p) => p.teks_pilihan.toLowerCase())).size !== incoming.length) {
        return badRequest("Pilihan jawaban tidak boleh sama");
      }
      if (!ids.has(correctId)) {
        return badRequest("Pilih satu jawaban yang benar");
      }

      pilihanUpdates = incoming.map((p) => ({ ...p, is_benar: p.pilihan_id === correctId }));
      jawabanText = incoming.find((p) => p.pilihan_id === correctId)!.teks_pilihan;
    } else {
      jawabanText = text(body.kunci_jawaban);
      if (!jawabanText || jawabanText.length > 500) {
        return badRequest("Kunci jawaban wajib diisi (maksimal 500 karakter)");
      }
      const alternatif: string[] = Array.isArray(body.kata_kunci)
        ? body.kata_kunci.map(text).filter(Boolean)
        : [];
      kataKunci = [
        ...new Set(alternatif.filter((a) => a.toLowerCase() !== jawabanText.toLowerCase())),
      ];
      if (kataKunci.length > 10 || kataKunci.some((a) => a.length > 100)) {
        return badRequest("Maksimal 10 jawaban alternatif, masing-masing maksimal 100 karakter");
      }
    }

    const { error: soalError } = await supabaseServer
      .from("soal")
      .update({ teks_soal: teksSoal, topik, penjelasan: penjelasan || null })
      .eq("soal_id", soal.soal_id);
    if (soalError) throw soalError;

    const pilihanResults = await Promise.all(
      pilihanUpdates.map((p) =>
        supabaseServer
          .from("pilihan_jawaban")
          .update({ teks_pilihan: p.teks_pilihan, is_benar: p.is_benar })
          .eq("pilihan_id", p.pilihan_id)
          .eq("soal_id", soal.soal_id),
      ),
    );
    const pilihanError = pilihanResults.find((r) => r.error)?.error;
    if (pilihanError) throw pilihanError;

    const { error: kunciError } = await supabaseServer
      .from("kunci_jawaban")
      .upsert(
        { soal_id: soal.soal_id, jawaban_text: jawabanText, kata_kunci: kataKunci },
        { onConflict: "soal_id" },
      );
    if (kunciError) throw kunciError;

    const [updated] = await loadQuestions(resolved.kuisId, soal.soal_id);
    return NextResponse.json({ soal: updated });
  } catch (error) {
    console.error("Update question error:", error);
    return NextResponse.json({ error: "Gagal menyimpan soal" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  try {
    const resolved = await resolve(request, ctx);
    if ("response" in resolved) return resolved.response;

    const { count } = await supabaseServer
      .from("soal")
      .select("soal_id", { count: "exact", head: true })
      .eq("kuis_id", resolved.kuisId);
    if ((count ?? 0) <= 1) {
      return badRequest("Kuis minimal harus memiliki 1 soal");
    }

    const { error } = await supabaseServer
      .from("soal")
      .delete()
      .eq("soal_id", resolved.soal.soal_id)
      .eq("kuis_id", resolved.kuisId);
    if (error) throw error;

    const totalSoal = await syncQuizAfterDelete(resolved.kuisId);
    return NextResponse.json({ success: true, totalSoal });
  } catch (error) {
    console.error("Delete question error:", error);
    return NextResponse.json({ error: "Gagal menghapus soal" }, { status: 500 });
  }
}
