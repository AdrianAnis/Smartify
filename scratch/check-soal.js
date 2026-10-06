const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from("soal")
    .select("soal_id, urutan, teks_soal, tipe_soal, tingkat_kesulitan, topik, poin")
    .eq("kuis_id", 16)
    .order("urutan", { ascending: true });

  console.log("Error:", error);
  console.log("Data count:", data?.length);
  if (data?.length > 0) {
    console.log("First question:", data[0]);
  }
}
main();
