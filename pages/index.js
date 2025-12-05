import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState(null);

  // Vérifier si un utilisateur est connecté + rôle
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

          // Redirection selon le rôle
          if (prof.role === "provider") {
            router.replace("/dashboard/provider");
            return;
          } else if (prof.role === "customer") {
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
        <p className="text-sm text-slate-500">
          Chargement de l'application...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-start pt-10 pb-16 px-4">
      <div className="w-full max-w-5xl space-y-16">

        {/* ========================================================= */}
        {/*                        HERO SECTION                      */}
        {/* ========================================================= */}
        <section
          className="relative grid md:grid-cols-2 gap-10 items-center rounded-2xl overflow-hidden"
          style={{
            backgroundImage: "url('/hero-bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60"></div>

          {/* Left: headline + CTA */}
          <div className="relative z-10 space-y-6 p-6 md:p-10">
            {/* BIG HEADLINE */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#D4AF37] leading-tight">
              Obtenez les services dont vous avez besoin avec Connect-ci.
            </h1>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                href="/auth?signup=true"
                className="w-full sm:w-auto bg-[#D4AF37] text-black py-3 px-6 rounded-xl text-sm sm:text-base font-semibold hover:bg-[#caa12f] shadow-md active:scale-[0.98] transition-transform text-center"
              >
                S'inscrire
              </Link>

              <Link
                href="/auth"
                className="w-full sm:w-auto border border-[#D4AF37] text-[#D4AF37] py-3 px-6 rounded-xl text-sm sm:text-base font-semibold hover:bg-[#D4AF37] hover:text-black shadow-md active:scale-[0.98] transition-transform text-center"
              >
                Se connecter
              </Link>
            </div>
          </div>

          {/* Right column left empty intentionally */}
          <div className="hidden md:block"></div>
        </section>

        {/* ========================================================= */}
        {/*                  COMMENT ÇA MARCHE SECTION               */}
        {/* ========================================================= */}
        <section className="space-y-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-[#D4AF37] text-center">
            Comment ça marche ?
          </h2>

          <div className="space-y-6">
            {/* Étape 01 */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 bg-[#13151A] border border-slate-700 rounded-2xl px-5 py-4 shadow-sm">
              <div className="text-3xl sm:text-4xl font-bold text-[#D4AF37] sm:w-16">
                01
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-semibold text-slate-100">
                  Postez une demande
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  Indiquez votre point de départ, votre destination et ce que
                  vous souhaitez faire livrer ou le service dont vous avez besoin.
                </p>
              </div>
            </div>

            {/* Étape 02 */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 bg-[#13151A] border border-slate-700 rounded-2xl px-5 py-4 shadow-sm">
              <div className="text-3xl sm:text-4xl font-bold text-[#D4AF37] sm:w-16">
                02
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-semibold text-slate-100">
                  Recevez des propositions
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  Les prestataires proches vous envoient leurs offres et messages
                  directement depuis Connect-ci.
                </p>
              </div>
            </div>

            {/* Étape 03 */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 bg-[#13151A] border border-slate-700 rounded-2xl px-5 py-4 shadow-sm">
              <div className="text-3xl sm:text-4xl font-bold text-[#D4AF37] sm:w-16">
                03
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-semibold text-slate-100">
                  Choisissez votre prestataire
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  Comparez les profils, les notes et les prix pour sélectionner
                  la personne qui correspond le mieux à votre besoin.
                </p>
              </div>
            </div>

            {/* Étape 04 */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 bg-[#13151A] border border-slate-700 rounded-2xl px-5 py-4 shadow-sm">
              <div className="text-3xl sm:text-4xl font-bold text-[#D4AF37] sm:w-16">
                04
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-semibold text-slate-100">
                  Suivez et finalisez
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  Discutez via le chat intégré, suivez l'avancement de la prestation
                  et notez le service une fois terminé.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/*                    NOS AVANTAGES SECTION                  */}
        {/* ========================================================= */}
        <section className="space-y-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-[#D4AF37] text-center">
            Nos avantages
          </h2>

          <div className="grid gap-4 md:grid-cols-3">

            {/* Avantage 1 */}
            <div className="bg-[#13151A] border border-slate-700 rounded-2xl p-6 shadow-md flex flex-col items-center text-center">
              <h3 className="text-sm sm:text-base font-semibold text-[#D4AF37] mb-2">
                À votre service
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Notre priorité est de vous accompagner dans vos besoins du quotidien, avec proximité et bienveillance.
              </p>
            </div>

            {/* Avantage 2 */}
            <div className="bg-[#13151A] border border-slate-700 rounded-2xl p-6 shadow-md flex flex-col items-center text-center">
              <h3 className="text-sm sm:text-base font-semibold text-[#D4AF37] mb-2">
                Sécurité
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Profils, historiques et notes vous aident à choisir des prestataires de confiance.
              </p>
            </div>

            {/* Avantage 3 */}
            <div className="bg-[#13151A] border border-slate-700 rounded-2xl p-6 shadow-md flex flex-col items-center text-center">
              <h3 className="text-sm sm:text-base font-semibold text-[#D4AF37] mb-2">
                Simplicité
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Une interface claire, moderne et agréable à utiliser, pensée pour vous.
              </p>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
