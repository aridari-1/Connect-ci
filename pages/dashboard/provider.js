// pages/dashboard/provider.js
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";
import Link from "next/link";

export default function ProviderServiceChooser() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        router.replace("/auth");
        return;
      }

      // Check role is provider
      const { data: prof } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (prof?.role !== "provider") {
        // If not provider, redirect to customer dashboard
        router.replace("/dashboard/customer");
        return;
      }

      setUser(data.user);
      setChecking(false);
    }

    loadUser();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-sm text-slate-500">
          Chargement du tableau de bord prestataire...
        </p>
      </div>
    );
  }

  const firstName = user?.email ? user.email.split("@")[0] : "Prestataire";

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-28 space-y-8">
      {/* HERO */}
      <div className="mt-6 space-y-1">
        <p className="text-sm text-slate-400 tracking-wide">
          Bonjour {firstName.charAt(0).toUpperCase() + firstName.slice(1)} 👋
        </p>
        <h1 className="text-3xl font-bold text-[#D4AF37] tracking-wide leading-tight">
          Quel service souhaitez-vous offrir ?
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Choisissez le type de mission que vous voulez accepter.
        </p>
      </div>

      {/* SERVICE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* LIVRAISON */}
        <Link
          href="/dashboard/provider/delivery"
          className="bg-[#13151A] border border-slate-700 rounded-2xl p-6 flex flex-col gap-3 hover:border-[#D4AF37] transition-all shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-[#D4AF37] flex items-center justify-center text-xl">
              🚚
            </div>
            <div>
              <h3 className="text-[#D4AF37] text-lg font-semibold">
                Livraisons
              </h3>
              <p className="text-xs text-slate-400">
                Acceptez des livraisons et gagnez de l&apos;argent.
              </p>
            </div>
          </div>
        </Link>

        {/* COIFFURE / TRESSES */}
        <Link
          href="/dashboard/provider/hair"
          className="bg-[#13151A] border border-slate-700 rounded-2xl p-6 flex flex-col gap-3 hover:border-[#D4AF37] transition-all shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-[#D4AF37] flex items-center justify-center text-lg">
              💇🏾‍♀️
            </div>
            <div>
              <h3 className="text-[#D4AF37] text-lg font-semibold">
                Coiffure & Tresses
              </h3>
              <p className="text-xs text-slate-400">
                Proposez vos services de coiffure, tresses et barbering.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
