// pages/dashboard/customer/hair/new.js
// ✨ Dark + Gold UI | French | Mobile-first | Inserts into hair_requests

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";

export default function NewHairRequest() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [gender, setGender] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [location, setLocation] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");

  const [saving, setSaving] = useState(false);

  // ------------------------------------
  // LOAD USER
  // ------------------------------------
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        router.replace("/auth");
        return;
      }
      setUser(data.user);
      setLoadingUser(false);
    }
    loadUser();
  }, [router]);

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400 text-sm">Chargement...</p>
      </div>
    );
  }

  // ------------------------------------
  // HAIR SERVICE OPTIONS
  // ------------------------------------
  const maleServices = [
    "Coupe simple",
    "Dégradé",
    "Barbe",
    "Rasage",
    "Coloration",
    "Autres",
  ];

  const femaleServices = [
    "Tresses",
    "Braids",
    "Retouches",
    "Crochet",
    "Perruque (installation)",
    "Défrisage",
    "Autres",
  ];

  const serviceOptions = gender === "male" ? maleServices : femaleServices;

  // ------------------------------------
  // SUBMIT FORM
  // ------------------------------------
  async function submitRequest() {
    if (!gender || !serviceType || !location || !preferredTime || !budget) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("hair_requests").insert({
      customer_id: user.id,
      gender,
      service_type: serviceType,
      description,
      location,
      preferred_time: preferredTime,
      budget: Number(budget),
      status: "open",
    });

    setSaving(false);

    if (error) {
      console.error(error);
      alert("Une erreur est survenue.");
      return;
    }

    router.push("/dashboard/customer/hair");
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-6 pb-16 text-white">

      {/* HEADER */}
      <h1 className="text-3xl font-bold text-[#D4AF37] mb-6">
        Nouvelle demande de coiffure
      </h1>

      {/* FORM CONTAINER */}
      <div className="space-y-6">

        {/* GENDER */}
        <div>
          <label className="text-sm font-semibold text-slate-300">
            Vous êtes :
          </label>

          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setGender("male")}
              className={`flex-1 py-3 rounded-xl border ${
                gender === "male"
                  ? "border-[#D4AF37] bg-[#D4AF37]/10"
                  : "border-slate-700 bg-[#13151A]"
              }`}
            >
              Homme
            </button>

            <button
              onClick={() => setGender("female")}
              className={`flex-1 py-3 rounded-xl border ${
                gender === "female"
                  ? "border-[#D4AF37] bg-[#D4AF37]/10"
                  : "border-slate-700 bg-[#13151A]"
              }`}
            >
              Femme
            </button>
          </div>
        </div>

        {/* SERVICE TYPE */}
        {gender && (
          <div>
            <label className="text-sm font-semibold text-slate-300">
              Type de service :
            </label>

            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full mt-2 bg-[#13151A] border border-slate-700 rounded-xl p-3 text-sm"
            >
              <option value="">Sélectionnez...</option>
              {serviceOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* LOCATION */}
        <div>
          <label className="text-sm font-semibold text-slate-300">
            Localisation :
          </label>
          <input
            type="text"
            placeholder="Ex : Cocody Angré, Marcory, Yopougon..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full mt-2 bg-[#13151A] border border-slate-700 rounded-xl p-3 text-sm"
          />
        </div>

        {/* TIME */}
        <div>
          <label className="text-sm font-semibold text-slate-300">
            Heure souhaitée :
          </label>
          <input
            type="text"
            placeholder="Ex : 14h, 18h30, demain matin..."
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value)}
            className="w-full mt-2 bg-[#13151A] border border-slate-700 rounded-xl p-3 text-sm"
          />
        </div>

        {/* BUDGET */}
        <div>
          <label className="text-sm font-semibold text-slate-300">
            Budget proposé (FCFA) :
          </label>
          <input
            type="number"
            placeholder="Ex : 3000"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="w-full mt-2 bg-[#13151A] border border-slate-700 rounded-xl p-3 text-sm"
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="text-sm font-semibold text-slate-300">
            Notes supplémentaires (optionnel) :
          </label>
          <textarea
            placeholder="Donnez plus de détails si nécessaire..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full mt-2 bg-[#13151A] border border-slate-700 rounded-xl p-3 text-sm h-28 resize-none"
          ></textarea>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          onClick={submitRequest}
          disabled={saving}
          className="w-full bg-[#D4AF37] text-black py-3 rounded-xl text-sm font-semibold hover:bg-[#be9d31] transition disabled:opacity-50"
        >
          {saving ? "Envoi..." : "Créer la demande"}
        </button>

        {/* BACK BUTTON */}
        <button
          onClick={() => router.push("/dashboard/customer/hair")}
          className="w-full bg-slate-800 text-slate-300 py-3 rounded-xl text-sm font-semibold mt-2"
        >
          Retour
        </button>
      </div>
    </div>
  );
}
