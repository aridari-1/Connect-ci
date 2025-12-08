// pages/dashboard/provider/hair.js
// Tableau de bord prestataire – Service coiffure (tresses / barbering)

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";
import Link from "next/link";

export default function ProviderHairDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [openRequests, setOpenRequests] = useState([]);
  const [myApplications, setMyApplications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [checkingRole, setCheckingRole] = useState(true);

  // Accordéon : "open" ou "apps"
  const [sectionActive, setSectionActive] = useState("open");

  // Charger utilisateur + vérifier rôle prestataire
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

        if (prof?.role !== "provider") {
          router.replace("/dashboard/customer");
          return;
        }
      } else {
        router.replace("/auth");
        return;
      }

      setCheckingRole(false);
      setLoading(false);
    }

    loadUser();
  }, [router]);

  // Charger données coiffure
  useEffect(() => {
    if (!user) return;

    async function loadData() {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(profileData);

      // Demandes ouvertes
      const { data: hairReqs } = await supabase
        .from("hair_requests")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });
      setOpenRequests(hairReqs || []);

      // Mes candidatures
      const { data: appsData } = await supabase
        .from("hair_applications")
        .select(
          `
          id,
          status,
          offer_price,
          created_at,
          request:request_id (
            id,
            gender,
            service_type,
            location,
            preferred_time,
            budget,
            status,
            customer_id,
            created_at
          )
        `
        )
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false });

      setMyApplications(appsData || []);
    }

    loadData();
  }, [user]);

  if (loading || checkingRole) {
    return (
      <p className="text-sm text-slate-500 px-4 pt-24">
        Chargement du tableau de bord coiffure...
      </p>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-[#13151A] p-6 rounded-xl border border-slate-700 mt-8 mb-24">
        <h2 className="text-xl font-semibold text-[#D4AF37] mb-2">
          Vous n&apos;êtes pas connecté(e)
        </h2>
        <button
          onClick={() => router.push("/auth")}
          className="mt-4 bg-[#D4AF37] text-black px-4 py-3 rounded-xl w-full text-sm font-semibold"
        >
          Aller à la connexion
        </button>
      </div>
    );
  }

  const firstName = profile?.full_name
    ? profile.full_name.split(" ")[0]
    : user.email?.split("@")[0] || "Prestataire";

  // 🔥 STATUTS TRADUITS EN FRANÇAIS
  function badgeStatut(status) {
    let bg = "bg-slate-700 text-slate-100";
    let label = "";

    if (status === "pending") {
      bg = "bg-amber-500/20 text-amber-300";
      label = "En attente";
    }
    if (status === "accepted") {
      bg = "bg-emerald-500/20 text-emerald-300";
      label = "Acceptée";
    }
    if (status === "rejected") {
      bg = "bg-rose-500/20 text-rose-300";
      label = "Rejetée";
    }
    if (status === "completed") {
      bg = "bg-[#D4AF37]/20 text-[#D4AF37]";
      label = "Terminée";
    }
    if (status === "open") {
      bg = "bg-sky-500/20 text-sky-300";
      label = "Ouverte";
    }

    return (
      <span
        className={`px-2 py-1 rounded-full text-[11px] font-medium ${bg}`}
      >
        {label}
      </span>
    );
  }

  // Traduction pour statut de la demande
  function translateRequestStatus(s) {
    if (s === "open") return "Ouverte";
    if (s === "assigned") return "Assignée";
    if (s === "completed") return "Terminée";
    return s;
  }

  // Accordéon
  function toggleSection(section) {
    setSectionActive((current) => (current === section ? null : section));
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4 pb-28 space-y-8">
      
      {/* 🌟 EN-TÊTE */}
      <header className="bg-[#13151A]/95 border border-slate-700 rounded-2xl p-5 sm:p-6 shadow-lg backdrop-blur">
        <p className="text-xs sm:text-sm text-slate-400 mb-1">
          Bonjour {firstName} 👋
        </p>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#D4AF37] leading-tight">
          Acceptez des prestations de coiffure et gagnez de l&apos;argent avec Connect-ci.
        </h1>
        
      </header>

      {/* 🌟 CARTES ACCORDÉON */}
      <section className="grid gap-4 sm:grid-cols-2">
        
        {/* COIFFURES DISPONIBLES */}
        <button
          type="button"
          onClick={() => toggleSection("open")}
          className={`rounded-2xl border p-4 sm:p-5 text-left transition-all shadow-lg ${
            sectionActive === "open"
              ? "border-[#D4AF37] bg-[#13151A]"
              : "border-slate-700 bg-[#0B0C10]"
          }`}
        >
          <h2 className="text-lg sm:text-xl font-semibold text-[#D4AF37]">
            Coiffures disponibles
          </h2>
          
        </button>

        {/* MES CANDIDATURES */}
        <button
          type="button"
          onClick={() => toggleSection("apps")}
          className={`rounded-2xl border p-4 sm:p-5 text-left transition-all shadow-lg ${
            sectionActive === "apps"
              ? "border-[#D4AF37] bg-[#13151A]"
              : "border-slate-700 bg-[#0B0C10]"
          }`}
        >
          <h2 className="text-lg sm:text-xl font-semibold text-[#D4AF37]">
            Mes candidatures
          </h2>
          
        </button>
      </section>

      {/* 🌟 SECTION : COIFFURES DISPONIBLES */}
      {sectionActive === "open" && (
        <section className="space-y-3">
          {openRequests.length === 0 && (
            <p className="text-xs text-slate-400">
              Aucune prestation disponible pour le moment.
            </p>
          )}

          {openRequests.map((req) => (
            <div
              key={req.id}
              className="bg-[#13151A] border border-slate-700 rounded-2xl p-4 shadow-md"
            >
              <p className="text-xs text-slate-400">
                {req.gender === "male"
                  ? "Homme"
                  : req.gender === "female"
                  ? "Femme"
                  : "Genre non précisé"}
              </p>

              <p className="text-sm font-semibold text-white">
                {req.service_type}
              </p>

              <p className="text-xs text-slate-400">
                Quartier : <span className="text-slate-200">{req.location}</span>
              </p>

              <p className="text-xs text-slate-400">
                Horaire :{" "}
                <span className="text-slate-200">{req.preferred_time}</span>
              </p>

              <div className="text-right mt-2">
                <Link
                  href={`/requests/hair/${req.id}`}
                  className="text-xs px-3 py-1.5 bg-[#D4AF37] text-black rounded-xl font-semibold"
                >
                  Voir & postuler
                </Link>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* 🌟 SECTION : MES CANDIDATURES */}
      {sectionActive === "apps" && (
        <section className="space-y-3">
          {myApplications.length === 0 && (
            <p className="text-xs text-slate-400">
              Vous n&apos;avez pas encore postulé à une prestation coiffure.
            </p>
          )}

          {myApplications.map((app) => {
            const req = app.request;

            return (
              <div
                key={app.id}
                className="bg-[#13151A] border border-slate-700 rounded-2xl p-4 shadow-md"
              >
                <p className="text-xs text-slate-400">
                  {req?.gender === "male"
                    ? "Homme"
                    : req?.gender === "female"
                    ? "Femme"
                    : "Genre non précisé"}
                </p>

                <p className="text-sm font-semibold text-white">
                  {req?.service_type}
                </p>

                <p className="text-xs text-slate-400">
                  Quartier : <span className="text-slate-200">{req?.location}</span>
                </p>

                <p className="text-xs text-slate-400">
                  Horaire :{" "}
                  <span className="text-slate-200">{req?.preferred_time}</span>
                </p>

                <p className="text-[11px] text-slate-500 mt-1">
                  Statut de la demande :{" "}
                  <span className="font-medium text-slate-300">
                    {translateRequestStatus(req?.status)}
                  </span>
                </p>

                <div className="mt-2">{badgeStatut(app.status)}</div>

                <div className="text-right mt-3">
                  <Link
                    href={`/requests/hair/${req.id}`}
                    className="text-xs px-3 py-1.5 bg-[#D4AF37] text-black rounded-xl font-semibold"
                  >
                    Voir les détails
                  </Link>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}

