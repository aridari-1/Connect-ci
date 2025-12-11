// pages/create-cagnotte.js
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";

// Function to generate a random token for private cagnottes
function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export default function CreateCagnottePage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAmount, setSelectedAmount] = useState(100);
  const [usageType, setUsageType] = useState("competition"); // 'competition' or 'personal'
  const [visibility, setVisibility] = useState("public"); // 'public' or 'private'
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        router.replace("/auth");
        return;
      }
      setUser(data.user);
      setLoading(false);
    }
    loadUser();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!title || !purpose) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (!user) {
      setError("Vous devez être connecté pour créer une cagnotte.");
      return;
    }

    const isPrivate = visibility === "private";
    const accessToken = isPrivate ? generateToken() : null;

    const { error: insertError } = await supabase.from("cagnottes").insert([
      {
        user_id: user.id,
        title,
        purpose,
        description,
        current_amount: 0,
        entry_price: selectedAmount,
        usage_type: usageType,
        is_public: !isPrivate,
        access_token: accessToken,
      },
    ]);

    if (insertError) {
      setError("Erreur lors de la création : " + insertError.message);
    } else {
      setSuccess(true);

      setTimeout(() => router.push("/dashboard/provider"), 1500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-300 bg-[#0B0C10]">
        Chargement...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0C10] text-slate-200 px-4 py-6">
      <h1 className="text-3xl font-bold text-[#D4AF37]">Créer une Cagnotte</h1>
      <p className="text-sm text-slate-400">
        Définissez une cagnotte et commencez à collecter des fonds.  
        La durée est automatiquement limitée à <span className="text-[#D4AF37]">20 heures</span>.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-[#13151A] border border-slate-700 rounded-xl p-6 space-y-6 mt-6"
      >
        {/* --- TITRE --- */}
        <div>
          <label className="block text-sm font-semibold text-slate-300">
            Titre de la cagnotte *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : Financer un concert"
            className="w-full bg-[#0B0C10] text-slate-200 border border-slate-600 rounded-lg p-2"
            required
          />
        </div>

        {/* --- BUT --- */}
        <div>
          <label className="block text-sm font-semibold text-slate-300">
            But de la cagnotte *
          </label>
          <input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Ex : Payer des livres, vêtements, déplacement…"
            className="w-full bg-[#0B0C10] text-slate-200 border border-slate-600 rounded-lg p-2"
            required
          />
        </div>

        {/* --- DESCRIPTION OPTIONAL --- */}
        <div>
          <label className="block text-sm font-semibold text-slate-300">
            Description (optionnelle)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Expliquez le but de la cagnotte…"
            className="w-full bg-[#0B0C10] text-slate-200 border border-slate-600 rounded-lg p-2"
            rows={4}
          />
        </div>

        {/* --- TYPE DE CAGNOTTE --- */}
        <div className="bg-[#0B0C10] p-4 rounded-xl border border-slate-700">
          <label className="block text-sm font-bold text-[#D4AF37] mb-2">
            Type de cagnotte *
          </label>

          <div className="space-y-3 text-sm">
            <label className="flex items-start gap-2">
              <input
                type="radio"
                value="personal"
                checked={usageType === "personal"}
                onChange={() => setUsageType("personal")}
              />
              <span>
                <span className="font-semibold">Pour moi-même (le créateur)</span>  
                – les fonds vous reviennent directement.
              </span>
            </label>

            <label className="flex items-start gap-2">
              <input
                type="radio"
                value="competition"
                checked={usageType === "competition"}
                onChange={() => setUsageType("competition")}
              />
              <span>
                <span className="font-semibold">Compétition / Tirage au sort</span>  
                – un participant sera sélectionné comme gagnant.
              </span>
            </label>
          </div>
        </div>

        {/* --- PRIX FIXE --- */}
        <div className="bg-[#0B0C10] p-4 rounded-xl border border-slate-700">
          <label className="block text-sm font-bold text-[#D4AF37] mb-2">
            Montant de participation *
          </label>
          <select
            value={selectedAmount}
            onChange={(e) => setSelectedAmount(Number(e.target.value))}
            className="w-full bg-[#0B0C10] border border-slate-600 rounded-lg p-2 text-slate-200"
          >
            {[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map((amt) => (
              <option key={amt} value={amt}>
                {amt} FCFA
              </option>
            ))}
          </select>
        </div>

        {/* --- PUBLIC / PRIVE --- */}
        <div className="bg-[#0B0C10] p-4 rounded-xl border border-slate-700">
          <label className="block text-sm font-bold text-[#D4AF37] mb-2">
            Visibilité *
          </label>

          <div className="space-y-3 text-sm">
            <label className="flex items-start gap-2">
              <input
                type="radio"
                value="public"
                checked={visibility === "public"}
                onChange={() => setVisibility("public")}
              />
              <span>
                <span className="font-semibold text-green-400">Publique</span>  
                – tout le monde peut voir et participer.
              </span>
            </label>

            <label className="flex items-start gap-2">
              <input
                type="radio"
                value="private"
                checked={visibility === "private"}
                onChange={() => setVisibility("private")}
              />
              <span>
                <span className="font-semibold text-red-400">Privée</span>  
                – accessible uniquement via un lien secret.
              </span>
            </label>
          </div>
        </div>

        {/* --- ERROR MESSAGE --- */}
        {error && (
          <p className="text-red-400 text-sm text-center bg-[#1E1010] border border-red-500/40 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        {/* --- SUCCESS MESSAGE --- */}
        {success && (
          <p className="text-green-400 text-sm text-center bg-[#0F1E10] border border-green-500/40 px-3 py-2 rounded-lg">
            Cagnotte créée avec succès !
          </p>
        )}

        {/* --- SUBMIT BUTTON --- */}
        <button
          type="submit"
          className="w-full bg-[#D4AF37] text-black font-semibold py-2 rounded-lg hover:bg-[#caa12f]"
        >
          Créer la cagnotte
        </button>
      </form>
    </div>
  );
}
