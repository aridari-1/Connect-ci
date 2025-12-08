import "@/styles/globals.css";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

export default function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // état pour ouvrir / fermer le menu hamburger
  const [showMenu, setShowMenu] = useState(false);

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

      {/* 🌟 TOP BAR WITH HAMBURGER MENU */}
      <div className="fixed top-0 left-0 w-full bg-[#13151A]/95 border-b border-slate-700 
                      text-[12px] text-slate-300 flex items-center justify-end px-4 py-2 z-50">

        {/* HAMBURGER BUTTON */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="text-slate-300 hover:text-[#D4AF37] text-xl"
        >
          ☰
        </button>
      </div>

      {/* 🌟 DROPDOWN MENU (ONLY WHEN CLICKED) */}
      {showMenu && (
        <div className="fixed top-10 right-3 bg-[#13151A] border border-slate-700 rounded-xl 
                        shadow-xl z-50 w-40 py-2 text-sm">
          <Link
            href="/trust"
            className="block px-4 py-2 text-slate-200 hover:bg-slate-800 hover:text-[#D4AF37]"
            onClick={() => setShowMenu(false)}
          >
            Confiance
          </Link>

          <Link
            href="/about"
            className="block px-4 py-2 text-slate-200 hover:bg-slate-800 hover:text-[#D4AF37]"
            onClick={() => setShowMenu(false)}
          >
            À propos
          </Link>
        </div>
      )}

      {/* 🌟 NAVBAR TOP FIXED BELOW THE MENU */}
      <header className="w-full border-b border-slate-700 bg-[#13151A] fixed top-8 left-0 right-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl text-white">
            Connect<span className="text-[#D4AF37]">.ci</span>
          </Link>

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

      {/* 🌟 MAIN CONTENT AREA */}
      <main className="max-w-5xl mx-auto px-4 pt-28 pb-24">
        {!loadingUser && <Component {...pageProps} />}
        {loadingUser && (
          <p className="text-sm text-slate-500">Chargement de la session...</p>
        )}
      </main>

      {/* 🌟 NAVIGATION MOBILE (user connecté) */}
      {user && profile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#13151A] border-t border-slate-800 sm:hidden z-30">
          <div className="flex justify-around py-2 text-xs">

            <Link href="/" className="flex flex-col items-center gap-1">
              <span className="text-xl">🏠</span>
              <span className="text-slate-200 font-medium">Accueil</span>
            </Link>

            {profile.role === "customer" && (
              <Link
                href="/post-request"
                className="flex flex-col items-center gap-1"
              >
                <span className="text-xl text-[#D4AF37]">➕</span>
                <span className="text-[#D4AF37] font-medium">Demande</span>
              </Link>
            )}

            {profile.role === "provider" && (
              <Link
                href="/dashboard/provider"
                className="flex flex-col items-center gap-1"
              >
                <span className="text-xl text-[#D4AF37]">📦</span>
                <span className="text-[#D4AF37] font-medium">Services</span>
              </Link>
            )}

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

      {/* 🌟 NAVIGATION MOBILE (non connecté) */}
      {!user && !loadingUser && (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#13151A] border-t border-slate-800 sm:hidden z-30">
          <div className="flex justify-around py-2 text-xs">
            <Link href="/" className="flex flex-col items-center gap-1">
              <span className="text-xl">🏠</span>
              <span className="text-slate-200 font-medium">Accueil</span>
            </Link>

            <Link
              href="/how-it-works"
              className="flex flex-col items-center gap-1"
            >
              <span className="text-xl text-[#D4AF37]">❓</span>
              <span className="text-[#D4AF37] font-medium">Guide</span>
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}
