import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";
import Link from "next/link";

export default function CustomerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();

      if (data?.user) {
        setUser(data.user);

        const { data: prof } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (prof?.role !== "customer") {
          router.replace("/dashboard/provider");
          return;
        }
      } else {
        router.replace("/auth");
        return;
      }

      setCheckingRole(false);
      setLoading(false);
    }

    loadUser();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    async function loadRequests() {
      const { data, error } = await supabase
        .from("delivery_requests")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) setMyRequests(data);
    }

    loadRequests();
  }, [user]);

  if (loading || checkingRole)
    return (
      <p className="text-sm text-slate-500 px-4 pt-24">
        Chargement...
      </p>
    );

  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-[#13151A] p-6 rounded-xl border border-slate-700 mt-8 mb-24">
        <h2 className="text-xl font-semibold text-[#D4AF37]">Vous n'êtes pas connecté</h2>
        <button
          onClick={() => router.push("/auth")}
          className="mt-4 bg-[#D4AF37] text-black px-4 py-3 rounded-xl w-full"
        >
          Aller à la connexion
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4 pb-28 space-y-8">

      {/* HEADER */}
      <header className="bg-[#13151A] p-5 sm:p-6 rounded-2xl border border-slate-700 shadow">
        <h1 className="text-xl sm:text-2xl font-semibold text-[#D4AF37]">
          Tableau de bord Client
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Suivez vos demandes et vérifiez leur statut en temps réel.
        </p>
      </header>

      {/* MY REQUESTS */}
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-semibold text-[#D4AF37]">
          Mes demandes
        </h2>

        {myRequests.length === 0 && (
          <p className="text-xs sm:text-sm text-slate-400">
            Vous n'avez pas encore créé de demande.
          </p>
        )}

        {myRequests.map((req) => (
          <div
            key={req.id}
            className="bg-[#13151A] border border-slate-700 rounded-2xl p-4 sm:p-5 hover:border-[#D4AF37] transition-all"
          >
            <div className="flex justify-between items-start gap-3">

              {/* Left side */}
              <div className="flex-1">
                <p className="text-sm sm:text-base font-semibold text-[#D4AF37]">
                  {req.pickup_location} → {req.dropoff_location}
                </p>

                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  {req.item_description}
                </p>

                <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
                  {new Date(req.created_at).toLocaleString()}
                </p>
              </div>

              {/* Status Badge */}
              <span
                className={`px-3 py-1 text-xs sm:text-sm rounded-xl font-semibold ${
                  req.status === "completed"
                    ? "border border-emerald-500 text-emerald-500 bg-emerald-500/10"
                    : req.status === "assigned"
                    ? "border border-blue-500 text-blue-500 bg-blue-500/10"
                    : req.status === "open"
                    ? "border border-amber-500 text-amber-500 bg-amber-500/10"
                    : "border border-red-500 text-red-500 bg-red-500/10"
                }`}
              >
                {req.status === "completed"
                  ? "Terminée"
                  : req.status === "assigned"
                  ? "En cours"
                  : req.status === "open"
                  ? "Ouverte"
                  : req.status}
              </span>
            </div>

            {/* OPEN LINK */}
            <Link
              href={`/requests/${req.id}`}
              className="text-xs sm:text-sm text-[#D4AF37] hover:underline block mt-2"
            >
              Ouvrir
            </Link>
          </div>
        ))}
      </section>

      {/* POST REQUEST BUTTON */}
      <div className="pb-10">
        <Link
          href="/post-request"
          className="w-full block text-center rounded-xl bg-[#D4AF37] text-black py-3 
          text-sm sm:text-base font-semibold hover:bg-[#be9d31] active:scale-[0.98] transition"
        >
          Nouvelle demande
        </Link>
      </div>

    </div>
  );
}
