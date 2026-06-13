import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";

export default function PostRequest() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);

  // Champs du formulaire
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [item, setItem] = useState("");
  const [budget, setBudget] = useState("");
  const [timePref, setTimePref] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // 🔒 Protection : seuls les clients peuvent publier
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();

      if (data?.user) {
        setUser(data.user);
        const { data: prof } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (prof?.role === "provider") {
          router.replace("/dashboard/provider");
          return;
        }
      } else {
        router.replace("/auth");
        return;
      }

      setCheckingUser(false);
    }

    loadUser();
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (!user) {
      setMessage("Vous devez être connecté pour publier une demande.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("delivery_requests").insert({
      customer_id: user.id,
      pickup_location: pickup,
      dropoff_location: dropoff,
      item_description: item,
      budget: budget ? Number(budget) : null,
      time_preference: timePref,
      city: "Abidjan",
    });

    if (error) {
      console.error(error);
      setMessage("Erreur lors de la publication. Veuillez réessayer.");
    } else {
      setMessage("Votre demande a été publiée avec succès !");
      setPickup("");
      setDropoff("");
      setItem("");
      setBudget("");
      setTimePref("");
    }

    setLoading(false);
  }

  if (checkingUser) {
    return (
      <p className="text-sm text-slate-500 px-4 pt-24">Vérification de votre session...</p>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-4 pb-32">

      <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-[#D4AF37] text-center sm:text-left">
        Publier une demande
      </h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-[#13151A] p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-700"
      >
        {/* PICKUP */}
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-300">
            Lieu de récupération
          </label>
          <input
            className="w-full border border-slate-700 bg-[#0B0C10] text-slate-200
            placeholder-slate-500 rounded-xl px-3 py-3 text-sm sm:text-base"
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
            placeholder="Ex : Cocody Angré"
            required
          />
        </div>

        {/* DROPOFF */}
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-300">
            Lieu de dépôt
          </label>
          <input
            className="w-full border border-slate-700 bg-[#0B0C10] text-slate-200
            placeholder-slate-500 rounded-xl px-3 py-3 text-sm sm:text-base"
            value={dropoff}
            onChange={(e) => setDropoff(e.target.value)}
            placeholder="Ex : Plateau centre-ville"
            required
          />
        </div>

        {/* ITEM DESCRIPTION */}
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-300">
            Description de l’article
          </label>
          <textarea
            className="w-full border border-slate-700 bg-[#0B0C10] text-slate-200
            placeholder-slate-500 rounded-xl px-3 py-3 text-sm sm:text-base h-24"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="Ex : documents, colis, nourriture…"
            required
          />
        </div>

        {/* TWO COLUMNS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* BUDGET */}
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">
              Budget (FCFA)
            </label>
            <input
              type="number"
              className="w-full border border-slate-700 bg-[#0B0C10] text-slate-200
              placeholder-slate-500 rounded-xl px-3 py-3 text-sm sm:text-base"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Ex : 2000"
            />
          </div>

          {/* TIME */}
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">
              Heure souhaitée
            </label>
            <input
              className="w-full border border-slate-700 bg-[#0B0C10] text-slate-200
              placeholder-slate-500 rounded-xl px-3 py-3 text-sm sm:text-base"
              value={timePref}
              onChange={(e) => setTimePref(e.target.value)}
              placeholder="Ex : Avant 17h"
            />
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#D4AF37] text-black py-3 text-sm sm:text-base
          font-semibold hover:bg-[#be9d31] disabled:opacity-60 active:scale-[0.98] transition"
        >
          {loading ? "Publication..." : "Publier la demande"}
        </button>

        {message && (
          <p className="text-center text-sm sm:text-base mt-2 text-slate-300">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
