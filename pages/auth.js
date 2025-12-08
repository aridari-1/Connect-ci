import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login"); // 'login' ou 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("customer");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        const user = data.user;
        if (user) {
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              full_name: fullName || null,
              role,
              city: "Abidjan",
            });
          if (profileError) throw profileError;
        }

        setMessage("Compte créé avec succès ! Vous pouvez maintenant vous connecter.");
        setMode("login");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        const loggedUser = data.user;
        if (loggedUser) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", loggedUser.id)
            .single();

          if (prof?.role === "provider") {
            router.push("/dashboard/provider");
          } else {
            router.push("/dashboard/customer");
          }
        } else {
          router.push("/");
        }
      }
    } catch (err) {
      setMessage(err.message || "Une erreur s'est produite");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-start sm:items-center justify-center px-4 pt-8 pb-20">
      <div className="w-full max-w-md bg-[#13151A] border border-slate-700 rounded-2xl shadow-sm p-6 sm:p-8">

        {/* Onglets */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
              mode === "login"
                ? "bg-[#D4AF37] text-black"
                : "bg-[#2e2e2e] text-slate-400"
            }`}
          >
            Connexion
          </button>

          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
              mode === "signup"
                ? "bg-[#D4AF37] text-black"
                : "bg-[#2e2e2e] text-slate-400"
            }`}
          >
            Inscription
          </button>
        </div>

        {/* Titre */}
        <h2 className="text-xl sm:text-2xl font-semibold mb-5 text-[#D4AF37] text-center">
          {mode === "login"
            ? "Connectez-vous à Connect"
            : "Créez votre compte"}
        </h2>

        {/* FORMULAIRE */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {mode === "signup" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nom complet
                </label>
                <input
                  className="w-full border border-slate-700 bg-[#0B0C10] text-slate-200 
                  placeholder-slate-500 rounded-xl px-3 py-3 text-sm sm:text-base"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex : Kouassi Yao"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Je suis :
                </label>
                <select
                  className="w-full border border-slate-700 bg-[#0B0C10] text-slate-200 
                  rounded-xl px-3 py-3 text-sm sm:text-base"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="customer">Client</option>
                  <option value="provider">prestataire</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full border border-slate-700 bg-[#0B0C10] text-slate-200 
              placeholder-slate-500 rounded-xl px-3 py-3 text-sm sm:text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              className="w-full border border-slate-700 bg-[#0B0C10] text-slate-200 
              placeholder-slate-500 rounded-xl px-3 py-3 text-sm sm:text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Au moins 6 caractères"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#D4AF37] text-black py-3 text-sm sm:text-base 
            font-semibold hover:bg-[#be9d31] disabled:opacity-60 active:scale-[0.98] transition"
          >
            {loading
              ? "Veuillez patienter..."
              : mode === "login"
              ? "Se connecter"
              : "S’inscrire"}
          </button>

          {message && (
            <p className="text-sm text-center mt-2 text-slate-300">{message}</p>
          )}
        </form>
      </div>
    </div>
  );
}