import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState(null);
  const [activeAdvantage, setActiveAdvantage] = useState(null);

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getUser();

      if (data?.user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (prof) {
          setProfile(prof);

          if (prof.role === "provider") {
            router.replace("/dashboard/provider");
            return;
          }
          if (prof.role === "customer") {
            router.replace("/dashboard/customer");
            return;
          }
        }
      }

      setChecking(false);
    }
    checkSession();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-sm text-slate-500">Chargement...</p>
      </div>
    );
  }

  const closeAdvantage = () => setActiveAdvantage(null);

  const getAdvantageContent = () => {
    if (activeAdvantage === "service")
      return {
        title: "À votre service",
        text:
          "Connect-ci vous met en relation avec des prestataires disponibles pour vos besoins du quotidien.",
      };
    if (activeAdvantage === "securite")
      return {
        title: "Sécurité",
        text:
          "Consultez les profils, historiques et notes pour choisir des personnes de confiance.",
      };
    if (activeAdvantage === "simplicite")
      return {
        title: "Simplicité",
        text:
          "Une interface claire, pensée pour le mobile, pour trouver ou offrir un service rapidement.",
      };
    return { title: "", text: "" };
  };

  const advantageContent = getAdvantageContent();

  return (
    <div
      className="landing-root min-h-screen relative flex flex-col items-center justify-center px-4 py-10 bg-black"
      style={{
        backgroundImage: "url('/hero-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/70" />

      <div className="relative z-10 w-full max-w-sm space-y-10 flex flex-col items-center text-center">

        {/* HERO */}
        <section className="w-full space-y-6">
          <h1 className="text-3xl font-bold text-[#D4AF37] leading-snug">
            Trouvez un service.
            <br />
            Offrez les vôtres.
          </h1>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 w-full">
            <Link
              href="/auth?signup=true"
              className="w-full bg-[#D4AF37] text-black py-3 rounded-xl text-sm font-semibold hover:bg-[#caa12f] shadow-md active:scale-[0.98]"
            >
              S'inscrire
            </Link>

            <Link
              href="/auth"
              className="w-full border border-[#D4AF37] text-[#D4AF37] py-3 rounded-xl text-sm font-semibold hover:bg-[#D4AF37] hover:text-black shadow-md active:scale-[0.98]"
            >
              Se connecter
            </Link>
          </div>
        </section>

        {/* ADVANTAGES */}
        <section className="w-full space-y-3">
          <h2 className="text-sm font-semibold text-[#D4AF37]">Nos avantages</h2>

          <div className="flex gap-3 overflow-x-auto pb-1">

            <button
              onClick={() => setActiveAdvantage("service")}
              className="flex-shrink-0 min-w-[110px] bg-black/40 border border-slate-600 rounded-2xl px-3 py-3 flex flex-col items-center gap-2 hover:border-[#D4AF37]"
            >
              <div className="w-9 h-9 rounded-full border border-[#D4AF37] flex items-center justify-center text-xs text-[#D4AF37]">☰</div>
              <span className="text-[11px] text-slate-100 font-medium">À votre service</span>
            </button>

            <button
              onClick={() => setActiveAdvantage("securite")}
              className="flex-shrink-0 min-w-[110px] bg-black/40 border border-slate-600 rounded-2xl px-3 py-3 flex flex-col items-center gap-2 hover:border-[#D4AF37]"
            >
              <div className="w-9 h-9 rounded-full border border-[#D4AF37] flex items-center justify-center text-xs text-[#D4AF37]">🔒</div>
              <span className="text-[11px] text-slate-100 font-medium">Sécurité</span>
            </button>

            <button
              onClick={() => setActiveAdvantage("simplicite")}
              className="flex-shrink-0 min-w-[110px] bg-black/40 border border-slate-600 rounded-2xl px-3 py-3 flex flex-col items-center gap-2 hover:border-[#D4AF37]"
            >
              <div className="w-9 h-9 rounded-full border border-[#D4AF37] flex items-center justify-center text-xs text-[#D4AF37]">⚙︎</div>
              <span className="text-[11px] text-slate-100 font-medium">Simplicité</span>
            </button>

          </div>
        </section>

      </div>

      {/* BOTTOM SHEET */}
      {activeAdvantage && (
        <div className="fixed inset-0 z-40 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={closeAdvantage} />
          <div className="relative z-50 w-full max-w-md bg-[#13151A] rounded-t-3xl border-t border-slate-700 p-5 pb-7 animate-[slideUp_0.25s_ease-out]">
            <div className="flex justify-center mb-3"><div className="w-10 h-1.5 rounded-full bg-slate-600" /></div>
            <h3 className="text-sm font-semibold text-[#D4AF37] mb-2 text-center">
              {advantageContent.title}
            </h3>
            <p className="text-xs text-slate-200 leading-relaxed text-center">
              {advantageContent.text}
            </p>
            <div className="mt-4 flex justify-center">
              <button
                onClick={closeAdvantage}
                className="text-xs px-4 py-2 rounded-full border border-slate-600 text-slate-200 hover:border-[#D4AF37] hover:text-[#D4AF37]"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL STYLES */}
      <style jsx global>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .landing-root {
            background-size: contain !important;
            background-position: top !important;
            background-repeat: no-repeat !important;
            background-color: black !important;
          }
        }
      `}</style>
    </div>
  );
}
