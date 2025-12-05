import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function CustomerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showHistory, setShowHistory] = useState(false); // NEW — expand/collapse

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);
      setLoading(false);
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (!user) return;

    async function loadRequests() {
      const { data } = await supabase
        .from('delivery_requests')
        .select(`
          id,
          pickup_location,
          dropoff_location,
          item_description,
          budget,
          status,
          created_at,
          applications:delivery_applications(count)
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      setRequests(data || []);
    }

    loadRequests();
  }, [user]);

  if (loading) return <p className="text-sm text-slate-500">Chargement...</p>;

  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-[#13151A] border border-slate-700 p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Vous n'êtes pas connecté</h2>
        <button
          onClick={() => router.push('/auth')}
          className="mt-4 bg-[#D4AF37] text-black px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#be9d31]"
        >
          Aller à la connexion
        </button>
      </div>
    );
  }

  // Extract first name for the hero header
  const firstName = user.email ? user.email.split('@')[0] : 'Utilisateur';

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* ========================================================= */}
      {/*                     HERO HEADER                          */}
      {/* ========================================================= */}
      <div className="mt-6 space-y-1">
  
  {/* Small username greeting */}
  <p className="text-sm text-slate-400 tracking-wide">
    Bonjour {firstName.charAt(0).toUpperCase() + firstName.slice(1)} 👋
  </p>

  {/* Large premium headline */}
  <h1 className="text-4xl font-bold text-[#D4AF37] tracking-wide leading-tight">
    Postez et faites vous livrer
  </h1>

</div>


      {/* ========================================================= */}
      {/*             ACTION CARDS (DEMANDE + HISTORIQUE)           */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* --- Card 1: Nouvelle Demande --- */}
        <div
          onClick={() => router.push('/post-request')}
          className="bg-[#13151A] border border-slate-700 rounded-2xl p-6 cursor-pointer hover:border-[#D4AF37] transition-all shadow-md"
        >
          <h3 className="text-[#D4AF37] text-xl font-semibold mb-2">Demande</h3>
          <p className="text-slate-400 text-sm">
            Créez une nouvelle demande de livraison.
          </p>
        </div>

        {/* --- Card 2: Demandes récentes (expand/collapse) --- */}
        <div
          onClick={() => setShowHistory(!showHistory)}
          className="bg-[#13151A] border border-slate-700 rounded-2xl p-6 cursor-pointer hover:border-[#D4AF37] transition-all shadow-md flex items-center justify-between"
        >
          <div>
            <h3 className="text-[#D4AF37] text-xl font-semibold mb-2">Demandes récentes</h3>
            <p className="text-slate-400 text-sm">
              Voir l’historique de vos actions.
            </p>
          </div>

          <span className="text-[#D4AF37] text-xl">
            {showHistory ? "▾" : "▸"}
          </span>
        </div>

      </div>

      {/* ========================================================= */}
      {/*                 EXPANDABLE RECENT REQUESTS                */}
      {/* ========================================================= */}
      {showHistory && (
        <div className="space-y-4 mt-4">

          {requests.length === 0 && (
            <p className="text-sm text-slate-400">Aucune demande récente.</p>
          )}

          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-[#13151A] rounded-2xl p-5 shadow-md border border-slate-700 hover:border-[#D4AF37] transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  {/* Pick-up → Drop-off */}
                  <p className="font-semibold text-sm text-[#D4AF37] mb-1">
                    {req.pickup_location} → {req.dropoff_location}
                  </p>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                    {req.item_description}
                  </p>

                  <p className="text-xs text-slate-500 mb-1">
                    {new Date(req.created_at).toLocaleString()}
                  </p>

                  {/* Status Badge */}
                  <span
                    className={`text-xs px-3 py-1 rounded-xl font-semibold ${
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

                {/* Right Side: Budget + View */}
                <div className="text-right space-y-2">
                  {req.budget && (
                    <p className="text-sm font-bold text-[#D4AF37]">
                      {req.budget.toLocaleString("fr-FR")} FCFA
                    </p>
                  )}

                  <Link
                    href={`/requests/${req.id}`}
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

      {/* ========================================================= */}
      {/*                 IMAGE SECTION (ADDED HERE)                */}
      {/* ========================================================= */}

      <div className="space-y-6 mt-10 pb-10">

        {/* GOLD TRUCK ICON */}
        <div className="flex justify-center">
          <img 
            src="/truck-gold.png" 
            alt="Gold Delivery Icon"
            className="w-32 h-32 opacity-90"
          />
        </div>

        {/* ABIDJAN NIGHT SKYLINE */}
        <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-700">
          <img 
            src="/abidjan-night.jpg" 
            alt="Abidjan by night"
            className="w-full object-cover opacity-80"
          />
        </div>

        {/* ABIDJAN PYRAMID BUILDING */}
        <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-700">
          <img 
            src="/abidjan-building.png"
            alt="Abidjan building"
            className="w-full object-cover opacity-90"
          />
        </div>

      </div>

    </div>
  );
}

