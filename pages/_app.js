import "@/styles/globals.css";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

export default function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Charger utilisateur + profil
  async function loadUserAndProfile() {
    const { data } = await supabase.auth.getUser();

    if (data?.user) {
      setUser(data.user);

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      setProfile(prof || null);
    } else {
      setUser(null);
      setProfile(null);
    }

    setLoadingUser(false);
  }

  useEffect(() => {
    loadUserAndProfile();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadUserAndProfile();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0C10] text-slate-200">

      {/* 🌟 NAVBAR FIXE (HAUT) */}
      <header className="w-full border-b border-slate-700 bg-[#13151A] fixed top-0 left-0 right-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="font-bold text-xl text-white">
            Connect<span className="text-[#D4AF37]">.ci</span>
          </Link>

          {/* Liens desktop uniquement */}
          <div className="hidden sm:flex gap-3 items-center">
            {user && profile && (
              <Link
                href={`/profile/${profile.id}`}
                className="text-sm text-slate-300 border border-slate-700 rounded-xl px-3 py-1 hover:bg-slate-800"
              >
                Profil
              </Link>
            )}

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

      {/* 🌟 CONTENU PRINCIPAL (haut + bas réservés) */}
      <main className="max-w-5xl mx-auto px-4 pt-20 pb-24">
        {!loadingUser && <Component {...pageProps} />}
        {loadingUser && (
          <p className="text-sm text-slate-500">Chargement de la session...</p>
        )}
      </main>

      {/* 🌟 NAVIGATION MOBILE (BAS) — ICONES + TEXTE */}
      {user && profile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#13151A] border-t border-slate-800 sm:hidden z-30">
          <div className="flex justify-around py-2 text-xs">

            {/* 🏠 ACCUEIL */}
            <Link href="/" className="flex flex-col items-center gap-1">
              <span className="text-xl">🏠</span>
              <span className="text-slate-200 font-medium">Accueil</span>
            </Link>

            {/* ➕ NOUVELLE DEMANDE (CLIENT SEULEMENT) */}
            {profile.role === "customer" && (
              <Link
                href="/post-request"
                className="flex flex-col items-center gap-1"
              >
                <span className="text-xl text-[#D4AF37]">➕</span>
                <span className="text-[#D4AF37] font-medium">
                  Nouvelle demande
                </span>
              </Link>
            )}

            {/* 📦 LIVRAISONS DISPONIBLES (LIVREUR SEULEMENT) */}
            {profile.role === "provider" && (
              <Link
                href="/dashboard/provider"
                className="flex flex-col items-center gap-1"
              >
                <span className="text-xl text-[#D4AF37]">📦</span>
                <span className="text-[#D4AF37] font-medium">Livraisons</span>
              </Link>
            )}

            {/* 👤 PROFIL */}
            <Link
              href={`/profile/${profile.id}`}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-xl">👤</span>
              <span className="text-slate-200 font-medium">Profil</span>
            </Link>
          </div>
        </nav>
      )}

      {/* 🌟 Si NON connecté → barre simple */}
      {!user && !loadingUser && (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#13151A] border-t border-slate-800 sm:hidden z-30">
          <div className="flex justify-around py-2 text-xs">
            <Link href="/" className="flex flex-col items-center gap-1">
              <span className="text-xl">🏠</span>
              <span className="text-slate-200 font-medium">Accueil</span>
            </Link>

            <Link href="/auth" className="flex flex-col items-center gap-1">
              <span className="text-xl text-[#D4AF37]">🔑</span>
              <span className="text-[#D4AF37] font-medium">Connexion</span>
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}