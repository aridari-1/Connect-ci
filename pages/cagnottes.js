// pages/cagnottes.js
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

// Public-view participation messages
function getPublicParticipationMessage(count) {
  if (count === 0) return "Soyez le premier à participer !";
  if (count < 3) return "Quelques personnes ont déjà contribué.";
  if (count < 7) return "La cagnotte commence à attirer du monde.";
  return "Beaucoup d'intérêt autour de cette cagnotte.";
}

export default function CagnottesListPage() {
  const [user, setUser] = useState(null);
  const [cagnottes, setCagnottes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      setUser(auth.user || null);

      let query = supabase
        .from("cagnottes")
        .select("*, participants_count:cagnottes_participants(count)")
        .order("created_at", { ascending: false });

      if (auth.user) {
        // Show all public + my own (even if private)
        query = query.or(`is_public.eq.true,user_id.eq.${auth.user.id}`);
      } else {
        // If not logged in, only public
        query = query.eq("is_public", true);
      }

      const { data, error } = await query;
      if (!error && data) setCagnottes(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0C10] text-slate-300 flex items-center justify-center">
        Chargement...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0C10] text-white px-4 py-6">
      <h1 className="text-2xl font-bold text-[#D4AF37]">Cagnottes</h1>
      <p className="text-xs text-slate-400 mt-1">
        Participez aux cagnottes publiques ou gérez celles que vous avez créées.
      </p>

      {/* CREATE BUTTON */}
      <div className="mt-4">
        <Link href="/create-cagnotte">
          <button className="w-full bg-[#D4AF37] text-black font-semibold py-2 rounded-lg hover:bg-[#caa12f]">
            Créer une nouvelle cagnotte
          </button>
        </Link>
      </div>

      {/* LIST */}
      <div className="mt-6 space-y-4">
        {cagnottes.length === 0 ? (
          <p className="text-slate-400 text-sm">Aucune cagnotte pour le moment.</p>
        ) : (
          cagnottes.map((cag) => {
            const isCreator = user?.id === cag.user_id;
            const count = cag.participants_count?.[0]?.count || 0;

            // Public or private link
            const link = cag.is_public
              ? `/requests/cagnotte/${cag.id}`
              : isCreator
              ? `/requests/cagnotte/${cag.id}?token=${cag.access_token}`
              : null;

            return (
              <div key={cag.id} className="bg-[#13151A] border border-slate-700 rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-[#D4AF37]">
                    {cag.title}
                  </h2>

                  {/* Badge publique / privée */}
                  <span
                    className={`px-2 py-1 rounded-full text-[11px] font-semibold ${
                      cag.is_public
                        ? "bg-emerald-700/40 text-emerald-300"
                        : "bg-slate-700/60 text-slate-200"
                    }`}
                  >
                    {cag.is_public ? "Publique" : "Privée"}
                  </span>
                </div>

                {/* Purpose */}
                <p className="text-xs text-slate-400 mt-1">{cag.purpose}</p>

                {/* Entry price */}
                <p className="text-xs text-slate-500 mt-1">
                  Contribution :{" "}
                  <span className="text-slate-200 font-semibold">{cag.entry_price} FCFA</span>
                </p>

                {/* Participation message (public view) */}
                <p className="text-[11px] text-slate-400 mt-2 italic">
                  {getPublicParticipationMessage(count)}
                </p>

                {/* Creator sees exact count */}
                {isCreator && (
                  <p className="text-[11px] text-[#D4AF37] mt-1">
                    ({count} contributions)
                  </p>
                )}

                {/* Access button */}
                {link ? (
                  <Link href={link}>
                    <button className="mt-3 w-full bg-[#D4AF37] text-black text-sm font-semibold py-2 rounded-lg hover:bg-[#caa12f]">
                      Voir la cagnotte
                    </button>
                  </Link>
                ) : (
                  <p className="mt-2 text-[11px] text-red-400">
                    Cagnotte privée (accès restreint)
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
