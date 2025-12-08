// pages/dashboard/customer.js
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";
import Link from "next/link";

export default function CustomerServiceChooser() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-sm text-slate-500">Chargement du tableau de bord...</p>
      </div>
    );
  }

  const firstName = user?.email ? user.email.split("@")[0] : "Client";

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-28 space-y-8">
      {/* HERO */}
      <div className="mt-6 space-y-1">
        <p className="text-sm text-slate-400 tracking-wide">
          Bonjour {firstName.charAt(0).toUpperCase() + firstName.slice(1)} 👋
        </p>
        <h1 className="text-3xl font-bold text-[#D4AF37] tracking-wide leading-tight">
          Choisissez un service
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Sélectionnez le service dont vous avez besoin aujourd&apos;hui.
        </p>
      </div>

      {/* SERVICE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* LIVRAISON */}
        <Link
          href="/dashboard/customer/delivery"
          className="bg-[#13151A] border border-slate-700 rounded-2xl p-6 flex flex-col gap-3 hover:border-[#D4AF37] transition-all shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-[#D4AF37] flex items-center justify-center text-xl">
              🚚
            </div>
            <div>
              <h3 className="text-[#D4AF37] text-lg font-semibold">
                Livraison
              </h3>
              <p className="text-xs text-slate-400">
                Faites-vous livrer des courses, colis ou documents.
              </p>
            </div>
          </div>
        </Link>

        {/* COIFFURE / TRESSES */}
        <Link
          href="/dashboard/customer/hair"
          className="bg-[#13151A] border border-slate-700 rounded-2xl p-6 flex flex-col gap-3 hover:border-[#D4AF37] transition-all shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-[#D4AF37] flex items-center justify-center text-lg">
              {/* Gold-outline style icon feel */}
              💇🏾‍♀️
            </div>
            <div>
              <h3 className="text-[#D4AF37] text-lg font-semibold">
                Coiffure & Tresses
              </h3>
              <p className="text-xs text-slate-400">
                Tresses, coupes, barbe, retouches à domicile ou en salon.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
