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
          Chargement de l&apos;application...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-start sm:justify-center pt-8 sm:pt-12 pb-8 sm:pb-10 px-4">
      <div className="w-full max-w-3xl text-center space-y-6 sm:space-y-8">
        {/* Titre */}
        <h1 className="text-3xl sm:text-4xl font-bold text-[#D4AF37] mt-4 sm:mt-6">
          Connect<span className="text-white">.ci</span>
        </h1>

        <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
          La plateforme qui connecte les{" "}
          <span className="text-[#D4AF37]">clients</span> ayant besoin de
          livraisons rapides avec des{" "}
          <span className="text-[#D4AF37]">livreurs disponibles</span> à
          Abidjan. Rapide. Simple. Fiable.
        </p>

        {/* Boutons CTA */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-2 sm:mt-4">
          <Link
            href="/auth"
            className="w-full sm:w-auto bg-[#D4AF37] text-black py-3 px-6 rounded-xl text-sm sm:text-base font-semibold hover:bg-[#caa12f] shadow-md active:scale-[0.98] transition-transform"
          >
            Se connecter
          </Link>

          <Link
            href="/auth?signup=true"
            className="w-full sm:w-auto border border-[#D4AF37] text-[#D4AF37] py-3 px-6 rounded-xl text-sm sm:text-base font-semibold hover:bg-[#D4AF37] hover:text-black shadow-md active:scale-[0.98] transition-transform"
          >
            Créer un compte
          </Link>
        </div>

        {/* Illustration */}
        <div className="mt-6 sm:mt-8 flex justify-center">
          <img
            src="/delivery-illustration.png"
            alt="Livraison"
            className="w-40 sm:w-56 md:w-64 opacity-80"
          />
        </div>

        {/* Sections informatives */}
        <div className="space-y-4 sm:space-y-6 mt-6 sm:mt-8">
          <div className="bg-[#13151A] border border-slate-700 rounded-2xl p-4 sm:p-6 shadow-sm text-left sm:text-center">
            <h3 className="text-base sm:text-lg font-semibold text-[#D4AF37] mb-2">
              Pour les clients
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Publiez une demande, expliquez ce que vous voulez faire livrer,
              recevez des candidatures de livreurs en quelques minutes.
            </p>
          </div>

          <div className="bg-[#13151A] border border-slate-700 rounded-2xl p-4 sm:p-6 shadow-sm text-left sm:text-center">
            <h3 className="text-base sm:text-lg font-semibold text-[#D4AF37] mb-2">
              Pour les livreurs
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Parcourez les demandes disponibles, proposez un prix et acceptez
              les tâches qui vous conviennent le mieux.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
