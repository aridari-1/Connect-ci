// pages/create-cagnotte.js
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";

export default function CreateCagnottePage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAmount, setSelectedAmount] = useState(100);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // -----------------------------------------------------
  // FIXED AUTH LOADING LOGIC
  // -----------------------------------------------------
  useEffect(() => {
    async function loadUser() {
      try {
        const { data } = await supabase.auth.getUser();

        if (data?.user) {
          setUser(data.user);
        } else {
          // Only redirect AFTER loading is complete
          router.push("/auth");
        }
      } catch (err) {
        console.error("AUTH ERROR:", err);
      }

      setLoading(false); // ← ALWAYS END LOADING
    }

    loadUser();
  }, [router]);

  // -----------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !purpose) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (!user) {
      setError("Utilisateur non authentifié.");
      return;
    }

    const { error } = await supabase.from("cagnottes").insert([
      {
        user_id: user.id,
        title,
        purpose,
        description,
        current_amount: 0,
        is_public: true,
        entry_price: selectedAmount,
        // deadline auto-set by Supabase: now() + interval '20 hours'
      },
    ]);

    if (error) {
      setError("Erreur de création : " + error.message);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/customer"), 1500);
    }
  };

  // -----------------------------------------------------
  // UI LOADING
  // -----------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-300 bg-[#0B0C10]">
        Chargement...
      </div>
    );
  }

  // -----------------------------------------------------  

  return (
    <div className="min-h-screen bg-[#0B0C10] text-slate-200 px-4 py-6">
      <h1 className="text-3xl font-bold text-[#D4AF37]">Créer une Cagnotte</h1>
      <p className="text-sm text-slate-400">
        La cagnotte sera automatiquement ouverte pendant 20 heures.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-[#13151A] border border-slate-700 rounded-xl p-6 space-y-4 mt-6"
      >
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-slate-300">
            Titre *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : Cagnotte pour un concert"
            className="w-full bg-[#0B0C10] text-slate-200 border border-slate-600 rounded-lg p-2"
            required
          />
        </div>

        {/* Purpose */}
        <div>
          <label className="block text-sm font-semibold text-slate-300">
            But *
          </label>
          <input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Ex : Aider à financer un événement"
            className="w-full bg-[#0B0C10] text-slate-200 border border-slate-600 rounded-lg p-2"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-slate-300">
            Description (optionnelle)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Expliquez le but de la cagnotte"
            className="w-full bg-[#0B0C10] text-slate-200 border border-slate-600 rounded-lg p-2"
            rows={4}
          />
        </div>

        {/* Entry Price */}
        <div>
          <label className="block text-sm font-semibold text-slate-300">
            Montant de participation *
          </label>
          <select
            value={selectedAmount}
            onChange={(e) => setSelectedAmount(Number(e.target.value))}
            className="w-full bg-[#0B0C10] text-slate-200 border border-slate-600 rounded-lg p-2"
            required
          >
            {[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map((v) => (
              <option key={v} value={v}>
                {v} FCFA
              </option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {/* Success */}
        {success && (
          <p className="text-green-400 text-sm">Cagnotte créée !</p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-[#D4AF37] text-black font-semibold py-2 rounded-lg hover:bg-[#caa12f]"
        >
          Créer
        </button>
      </form>
    </div>
  );
}
