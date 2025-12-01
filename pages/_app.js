import "@/styles/globals.css";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

export default function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user + profile
  async function loadUser() {
    const { data } = await supabase.auth.getUser();

    if (data?.user) {
      setUser(data.user);

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      setProfile(prof);
    } else {
      setUser(null);
      setProfile(null);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadUser();

    // Re-load when login/logout happens
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0C10] text-slate-200">

      {/* ---------- NAVIGATION BAR ---------- */}
      <header className="w-full border-b border-slate-700 bg-[#13151A]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">

          {/* LOGO */}
          <Link href="/" className="font-bold text-xl text-white">
            Connect<span className="text-[#D4AF37]">.ci</span>
          </Link>

          {/* MENU */}
          <div className="flex gap-3">

            {/* --------------------------- */}
            {/* SHOW CORRECT DASHBOARD LINK */}
            {/* --------------------------- */}
            {profile?.role === "customer" && (
              <Link
                href="/dashboard/customer"
                className="text-sm text-[#D4AF37] border border-[#D4AF37] rounded-xl px-3 py-1 hover:bg-[#D4AF37] hover:text-black"
              >
                Dashboard (Client)
              </Link>
            )}

            {profile?.role === "provider" && (
              <Link
                href="/dashboard/provider"
                className="text-sm text-[#D4AF37] border border-[#D4AF37] rounded-xl px-3 py-1 hover:bg-[#D4AF37] hover:text-black"
              >
                Dashboard (Livreur)
              </Link>
            )}

            {/* ---------------------- */}
            {/* SHOW PROFILE PAGE LINK */}
            {/* ---------------------- */}
            {user && profile && (
              <Link
                href={`/profile/${profile.id}`}
                className="text-sm text-slate-300 border border-slate-700 rounded-xl px-3 py-1 hover:bg-slate-800"
              >
                Profil
              </Link>
            )}

            {/* LOGIN / ACCOUNT BUTTON */}
            {!user ? (
              <Link
                href="/auth"
                className="text-sm text-slate-300 border border-slate-700 rounded-xl px-3 py-1 hover:bg-slate-800"
              >
                Connexion
              </Link>
            ) : (
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  setUser(null);
                  setProfile(null);
                }}
                className="text-sm text-red-400 border border-red-600 rounded-xl px-3 py-1 hover:bg-red-900/20"
              >
                Déconnexion
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ---------- PAGE CONTENT ---------- */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {!loading && <Component {...pageProps} />}
      </main>
    </div>
  );
}
