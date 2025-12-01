import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/router';
import Link from 'next/link';
import RequestRatingDisplay from '@/components/RequestRatingDisplay';

export default function ProviderDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [openRequests, setOpenRequests] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [ratingsMap, setRatingsMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Load user
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);
      setLoading(false);
    }
    loadUser();
  }, []);

  // Load profile + requests + apps
  useEffect(() => {
    if (!user) return;

    async function loadData() {
      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(profileData);

      // Load open requests
      const { data: requestsData } = await supabase
        .from('delivery_requests')
        .select('*')
        .eq('city', 'Abidjan')
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      setOpenRequests(requestsData || []);

      // Load applications
      const { data: appsData } = await supabase
        .from('delivery_applications')
        .select(`
          id,
          status,
          offer_price,
          created_at,
          request:request_id (
            id,
            pickup_location,
            dropoff_location,
            item_description,
            budget,
            status,
            created_at
          )
        `)
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

      setMyApplications(appsData || []);

      // Load ratings for ALL requests the provider completed
      const requestIds = (appsData || [])
        .map(a => a.request?.id)
        .filter(Boolean);

      if (requestIds.length > 0) {
        const { data: ratingsData } = await supabase
          .from('ratings') 
          .select('*')
          .in('request_id', requestIds);

        // Convert to map for fast access
        const map = {};
        ratingsData?.forEach(r => {
          map[r.request_id] = r;
        });

        setRatingsMap(map);
      }
    }

    loadData();
  }, [user]);

  if (loading) return <p className="text-sm text-slate-500">Chargement...</p>;

  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-[#13151A] p-6 rounded-xl border border-slate-700">
        <h2 className="text-xl font-semibold text-[#D4AF37]">Vous n'êtes pas connecté</h2>
        <button
          onClick={() => router.push('/auth')}
          className="mt-4 bg-[#D4AF37] text-black px-4 py-2 rounded-xl"
        >
          Aller à la connexion
        </button>
      </div>
    );
  }

  if (profile && profile.role !== 'provider') {
    return (
      <div className="max-w-md mx-auto bg-[#13151A] p-6 border border-slate-700 rounded-xl">
        <h2 className="text-xl font-semibold text-[#D4AF37]">Accès refusé</h2>
        <p className="text-sm text-slate-400">Votre compte n'est pas livreur.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* HEADER */}
      <header className="bg-[#13151A] p-5 rounded-2xl border border-slate-700 shadow">
        <h1 className="text-2xl font-semibold text-[#D4AF37]">Tableau de bord Livreur</h1>
        <p className="text-sm text-slate-400">Consultez les livraisons disponibles et suivez vos candidatures.</p>
      </header>

      {/* AVAILABLE REQUESTS */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#D4AF37]">Livraisons disponibles</h2>

        {openRequests.length === 0 && (
          <p className="text-slate-400 text-sm">Aucune livraison disponible pour le moment.</p>
        )}

        {(openRequests || []).map(req => (
          <div
            key={req.id}
            className="bg-[#13151A] border border-slate-700 rounded-2xl p-5 hover:border-[#D4AF37] transition-all"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-semibold text-[#D4AF37]">
                  {req.pickup_location} → {req.dropoff_location}
                </p>
                <p className="text-xs text-slate-400">{req.item_description}</p>
                <p className="text-[11px] text-slate-500">{new Date(req.created_at).toLocaleString()}</p>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-[#D4AF37]">
                  {req.budget?.toLocaleString('fr-FR')} FCFA
                </p>
                <Link
                  href={`/requests/${req.id}`}
                  className="inline-block mt-2 px-4 py-2 rounded-xl bg-[#D4AF37] text-black text-xs font-medium hover:bg-[#be9d31]"
                >
                  Voir & postuler
                </Link>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* MY APPLICATIONS */}
      <section className="space-y-3 pb-10">
        <h2 className="text-lg font-semibold text-[#D4AF37]">Mes candidatures</h2>

        {myApplications.length === 0 && (
          <p className="text-sm text-slate-400">Aucune candidature envoyée.</p>
        )}

        {myApplications.map((app) => {
          const rating = ratingsMap[app.request?.id];

          return (
            <div
              key={app.id}
              className="bg-[#13151A] border border-slate-700 rounded-2xl p-5 hover:border-[#D4AF37] transition-all"
            >
              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#D4AF37]">
                    {app.request?.pickup_location} → {app.request?.dropoff_location}
                  </p>
                  <p className="text-xs text-slate-400">{app.request?.item_description}</p>
                </div>

                {/* STATUS BADGE */}
                <span
                  className={`px-3 py-1 text-xs rounded-xl font-semibold ${
                    app.request?.status === "completed"
                      ? "border border-emerald-500 text-emerald-500 bg-emerald-500/10"
                      : app.status === "accepted"
                      ? "border border-blue-500 text-blue-500 bg-blue-500/10"
                      : app.status === "pending"
                      ? "border border-amber-500 text-amber-500 bg-amber-500/10"
                      : "border border-red-500 text-red-500 bg-red-500/10"
                  }`}
                >
                  {app.request?.status === "completed" ? "Terminée" : app.status}
                </span>
              </div>

              {/* OFFER PRICE */}
              <div className="text-xs text-slate-400 mt-2">
                {app.offer_price && (
                  <span className="font-semibold text-[#D4AF37]">
                    Offre : {app.offer_price.toLocaleString('fr-FR')} FCFA
                  </span>
                )}
              </div>

              {/* OPEN LINK */}
              <Link
                href={`/requests/${app.request?.id}`}
                className="text-xs text-[#D4AF37] hover:underline block mt-1"
              >
                Ouvrir la demande
              </Link>

              {/* ⭐ RATING DISPLAY */}
              {rating && (
                <div className="mt-3 p-3 bg-[#0B0C10] border border-slate-700 rounded-xl">
                  <p className="text-xs text-slate-300 font-semibold">Note du client :</p>
                  <p className="text-[#D4AF37] text-lg mt-1">
                    {'★'.repeat(rating.rating)}{'☆'.repeat(5 - rating.rating)}
                  </p>
                  {rating.review && (
                    <p className="text-xs text-slate-400 mt-1 italic">
                      “{rating.review}”
                    </p>
                  )}
                </div>
              )}

            </div>
          );
        })}
      </section>
    </div>
  );
}
