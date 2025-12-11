import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function ProviderCagnottesPage() {
  const [user, setUser] = useState(null);
  const [cagnottes, setCagnottes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        return;
      }
      setUser(data.user);
    }

    async function fetchCagnottes() {
      if (user) {
        const { data, error } = await supabase
          .from("cagnottes")
          .select("*")
          .eq("user_id", user.id);
        if (error) {
          console.error("Error loading cagnottes:", error);
        } else {
          setCagnottes(data);
        }
      }
      setLoading(false);
    }

    loadUser();
    fetchCagnottes();
  }, [user]);

  if (loading) {
    return <p>Chargement des cagnottes...</p>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#D4AF37]">Vos Cagnottes</h1>
      <div className="space-y-6">
        {cagnottes.map((cagnotte) => (
          <div key={cagnotte.id} className="bg-[#13151A] border border-slate-700 rounded-xl p-6 shadow-md">
            <h2 className="text-xl text-[#D4AF37]">{cagnotte.title}</h2>
            <p>{cagnotte.purpose}</p>
            <p className="text-slate-400">Objectif: {cagnotte.current_amount} / {cagnotte.total_amount} CFA</p>
            <Link href={`/requests/cagnotte/${cagnotte.id}`} className="text-[#D4AF37] underline">
              Voir les détails
            </Link>
          </div>
        ))}
      </div>
      <Link
        href="/create-cagnotte"
        className="block mt-4 text-[#D4AF37] bg-[#13151A] hover:bg-[#D4AF37] text-black py-2 px-4 rounded-lg text-center"
      >
        Créer une Cagnotte
      </Link>
    </div>
  );
}
