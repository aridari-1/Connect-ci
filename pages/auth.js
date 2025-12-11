// pages/auth.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";

export default function AuthPage() {
  const router = useRouter();
  const { redirect } = router.query;

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("customer");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (user) {
        const target = redirect ? decodeURIComponent(redirect) : "/dashboard/customer";
        router.replace(target);
      }
    }
    checkUser();
  }, [redirect, router]);

  function computeRedirect(role) {
    if (redirect) return decodeURIComponent(redirect);
    return role === "provider" ? "/dashboard/provider" : "/dashboard/customer";
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMsg("Erreur de connexion : " + error.message);
      setLoading(false);
      return;
    }

    const user = data.user;

    let roleFromProfile = "customer";
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role) roleFromProfile = profile.role;
    }

    const target = computeRedirect(roleFromProfile);
    router.replace(target);
  }

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMsg("Erreur : " + error.message);
      setLoading(false);
      return;
    }

    const user = data.user;

    if (!user) {
      setMsg("Vérifiez votre email pour continuer.");
      setLoading(false);
      return;
    }

    await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email,
        full_name: fullName || user.email,
        role,
      },
      { onConflict: "id" }
    );

    const target = computeRedirect(role);
    router.replace(target);
  }

  return (
    <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#13151A] border border-slate-700 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-center text-[#D4AF37] mb-2">
          {mode === "login" ? "Connexion" : "Inscription"}
        </h1>

        {/* TABS */}
        <div className="flex mb-4 border border-slate-700 rounded-xl overflow-hidden">
          <button
            className={`flex-1 py-2 text-sm font-semibold ${
              mode === "login" ? "bg-[#D4AF37] text-black" : "text-slate-300"
            }`}
            onClick={() => setMode("login")}
          >
            Se connecter
          </button>
          <button
            className={`flex-1 py-2 text-sm font-semibold ${
              mode === "signup" ? "bg-[#D4AF37] text-black" : "text-slate-300"
            }`}
            onClick={() => setMode("signup")}
          >
            Créer un compte
          </button>
        </div>

        <form
          onSubmit={mode === "login" ? handleLogin : handleSignup}
          className="space-y-4"
        >
          {mode === "signup" && (
            <div>
              <label className="text-xs font-semibold text-slate-300">
                Nom complet
              </label>
              <input
                type="text"
                className="w-full bg-[#0B0C10] mt-1 p-2 border border-slate-700 rounded-lg text-slate-200"
                placeholder="Ex : Ange Diallo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-slate-300">
              Email
            </label>
            <input
              type="email"
              className="w-full bg-[#0B0C10] mt-1 p-2 border border-slate-700 rounded-lg text-slate-200"
              placeholder="vous@example.com"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-semibold text-slate-300">
              Mot de passe
            </label>
            <input
              type="password"
              className="w-full bg-[#0B0C10] mt-1 p-2 border border-slate-700 rounded-lg text-slate-200"
              placeholder="••••••••"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {msg && (
            <p className="text-center text-red-400 text-xs bg-red-900/20 p-2 rounded-lg">
              {msg}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-[#D4AF37] text-black py-2 rounded-lg font-semibold"
          >
            {loading
              ? "Veuillez patienter…"
              : mode === "login"
              ? "Se connecter"
              : "Créer un compte"}
          </button>
        </form>
      </div>
    </div>
  );
}
