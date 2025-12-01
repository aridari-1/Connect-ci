import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function CustomerProfile() {
  const router = useRouter();
  const { id } = router.query;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function loadProfile() {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (!error) setProfile(data);
      setLoading(false);
    }

    loadProfile();
  }, [id]);

  if (loading)
    return <p className="text-sm text-slate-500">Chargement du profil...</p>;

  if (!profile)
    return <p className="text-sm text-red-500">Profil introuvable.</p>;

  return (
    <div className="max-w-xl mx-auto bg-[#13151A] rounded-2xl shadow-lg p-6 border border-slate-700 space-y-6">

      {/* HEADER */}
      <div className="flex items-center gap-4">
        <img
          src={profile.avatar_url || "https://via.placeholder.com/80"}
          className="w-20 h-20 rounded-full object-cover border border-slate-600"
        />
        <div>
          <h1 className="text-2xl font-semibold text-[#D4AF37]">
            {profile.full_name}
          </h1>
          <p className="text-sm text-slate-400">Client Connect</p>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-3 bg-[#0B0C10] rounded-xl border border-slate-700">
          <p className="text-lg font-semibold text-[#D4AF37]">
            {profile.total_requests || 0}
          </p>
          <p className="text-xs text-slate-400">Demandes</p>
        </div>

        <div className="p-3 bg-[#0B0C10] rounded-xl border border-slate-700">
          <p className="text-lg font-semibold text-[#D4AF37]">
            {profile.completed_requests || 0}
          </p>
          <p className="text-xs text-slate-400">Terminées</p>
        </div>

        <div className="p-3 bg-[#0B0C10] rounded-xl border border-slate-700">
          <p className="text-lg font-semibold text-[#D4AF37]">Abidjan</p>
          <p className="text-xs text-slate-400">Ville</p>
        </div>
      </div>

      {/* BIO */}
      <div className="bg-[#0B0C10] p-4 rounded-xl border border-slate-700">
        <h3 className="text-lg font-semibold text-[#D4AF37] mb-1">À propos</h3>
        <p className="text-sm text-slate-300">
          {profile.bio || "Ce client n’a pas encore rédigé de bio."}
        </p>
      </div>

      {/* BACK BUTTON */}
      <button
        onClick={() => router.back()}
        className="w-full bg-[#D4AF37] text-black py-2 rounded-xl text-sm font-semibold hover:bg-[#be9d31]"
      >
        Retour
      </button>
    </div>
  );
}
