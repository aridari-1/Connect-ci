// pages/dashboard/customer/hair.js
// ✨ Updated with correct path: /requests/hair/[id].js

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";
import Link from "next/link";

export default function CustomerHairDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [showHistory, setShowHistory] = useState(false);

  // -----------------------------------
  // LOAD USER
  // -----------------------------------
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        router.replace("/auth");
        return;
      }
      setUser(data.user);
      setLoadingUser(false);
    }
    loadUser();
  }, [router]);

  // -----------------------------------
  // LOAD USER HAIR REQUESTS
  // -----------------------------------
  useEffect(() => {
    if (!user) return;
    async function fetchRequests() {
      setLoadingRequests(true);
      const { data } = await supabase
        .from("hair_requests")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      setMyRequests(data || []);
      setLoadingRequests(false);
    }
    fetchRequests();
  }, [user]);

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-sm text-slate-500">Chargement...</p>
      </div>
    );
  }

  const firstName = user?.email ? user.email.split("@")[0] : "Client";

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-28 space-y-8">

      {/* HERO HEADER */}
      <div className="mt-6 space-y-1">
        <p className="text-sm text-slate-400 tracking-wide">
          Bonjour {firstName.charAt(0).toUpperCase() + firstName.slice(1)} 👋
        </p>

        <h1 className="text-4xl font-bold text-[#D4AF37] tracking-wide leading-tight">
          Coiffure & Barbering
        </h1>

        <p className="text-xs text-slate-400 mt-1">
          Demandez une coiffure, tresses, coupe ou retouches facilement.
        </p>
      </div>

      {/* ACTION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* CREATE NEW REQUEST */}
        <div
          onClick={() => router.push("/dashboard/customer/hair/new")}
          className="bg-[#13151A] border border-slate-700 rounded-2xl p-6 cursor-pointer shadow-md hover:border-[#D4AF37] transition-all"
        >
          <h3 className="text-[#D4AF37] text-xl font-semibold mb-2">
            Nouvelle demande
          </h3>
          <p className="text-slate-400 text-sm">
            Créez une nouvelle demande de coiffure.
          </p>
        </div>

        {/* SHOW HISTORY */}
        <div
          onClick={() => setShowHistory(!showHistory)}
          className="bg-[#13151A] border border-slate-700 rounded-2xl p-6 cursor-pointer shadow-md hover:border-[#D4AF37] transition-all flex items-center justify-between"
        >
          <div>
            <h3 className="text-[#D4AF37] text-xl font-semibold mb-2">
              Mes demandes récentes
            </h3>
            <p className="text-slate-400 text-sm">
              Affichez toutes vos demandes passées.
            </p>
          </div>
          <span className="text-[#D4AF37] text-xl">
            {showHistory ? "▾" : "▸"}
          </span>
        </div>
      </div>

      {/* REQUEST HISTORY */}
      {showHistory && (
        <div className="space-y-4 mt-4">

          {loadingRequests && (
            <p className="text-xs text-slate-500">Chargement de vos demandes...</p>
          )}

          {!loadingRequests && myRequests.length === 0 && (
            <p className="text-xs text-slate-500">
              Vous n'avez pas encore créé de demande de coiffure.
            </p>
          )}

          {myRequests.map((req) => (
            <div
              key={req.id}
              className="bg-[#13151A] rounded-2xl p-5 shadow-md border border-slate-700 hover:border-[#D4AF37] transition-all"
            >
              <div className="flex justify-between items-start">

                {/* LEFT INFO */}
                <div>
                  <p className="font-semibold text-sm text-[#D4AF37] mb-1">
                    {req.gender === "male" ? "Homme" : "Femme"} · {req.service_type}
                  </p>

                  <p className="text-xs text-slate-400 mb-1">{req.location}</p>
                  <p className="text-xs text-slate-500 mb-1">{req.preferred_time}</p>
                  <p className="text-xs text-slate-500 mb-2">
                    {new Date(req.created_at).toLocaleString("fr-FR")}
                  </p>

                  {req.description && (
                    <p className="text-xs text-slate-400 mb-2">
                      {req.description}
                    </p>
                  )}

                  <span
                    className={`text-[11px] px-3 py-1 rounded-xl font-semibold ${
                      req.status === "open"
                        ? "border border-amber-500 text-amber-500 bg-amber-500/10"
                        : req.status === "assigned"
                        ? "border border-blue-500 text-blue-500 bg-blue-500/10"
                        : req.status === "completed"
                        ? "border border-emerald-500 text-emerald-500 bg-emerald-500/10"
                        : "border border-slate-500 text-slate-500 bg-slate-500/10"
                    }`}
                  >
                    {req.status === "open"
                      ? "Ouverte"
                      : req.status === "assigned"
                      ? "Assignée"
                      : req.status === "completed"
                      ? "Terminée"
                      : req.status}
                  </span>
                </div>

                {/* RIGHT SIDE */}
                <div className="text-right space-y-2">
                  <p className="text-sm font-bold text-[#D4AF37]">
                    {req.budget?.toLocaleString("fr-FR")} FCFA
                  </p>

                  {/* FIXED URL — now using /requests/hair/[id] */}
                  <Link
                    href={`/requests/hair/${req.id}`}
                    className="inline-block bg-[#D4AF37] text-black px-4 py-2 text-xs font-semibold rounded-xl hover:bg-[#be9d31]"
                  >
                    Voir
                  </Link>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
