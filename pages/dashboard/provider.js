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
  const [checkingRole, setCheckingRole] = useState(true);

  // NEW STATE FOR EXPANSION
  const [showOpenRequests, setShowOpenRequests] = useState(false);
  const [showApplications, setShowApplications] = useState(false);

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

        if (prof?.role !== "provider") {
          router.replace("/dashboard/customer");
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

    async function loadData() {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(profileData);

      const { data: requestsData } = await supabase
        .from('delivery_requests')
        .select('*')
        .eq('city', 'Abidjan')
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      setOpenRequests(requestsData || []);

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
            customer_id,
            created_at
          )
        `)
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

      setMyApplications(appsData || []);

      const requestIds = (appsData || [])
        .map(a => a.request?.id)
        .filter(Boolean);

      if (requestIds.length > 0) {
        const { data: ratingsData } = await supabase
          .from('ratings')
          .select('*')
          .in('request_id', requestIds);

        const map = {};
        ratingsData?.forEach(r => map[r.request_id] = r);
        setRatingsMap(map);
      }
    }

    loadData();
  }, [user]);

  if (loading || checkingRole)
    return <p className="text-sm text-slate-500 px-4 pt-24">Chargement...</p>;

  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-[#13151A] p-6 rounded-xl border border-slate-700 mt-8 mb-24">
        <h2 className="text-xl font-semibold text-[#D4AF37]">Vous n'êtes pas connecté</h2>
        <button
          onClick={() => router.push('/auth')}
          className="mt-4 bg-[#D4AF37] text-black px-4 py-3 rounded-xl w-full"
        >
          Aller à la connexion
        </button>
      </div>
    );
  }

  // Extract first name
  const firstName = user.email ? user.email.split('@')[0] : "Utilisateur";

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4 pb-28 space-y-8">

      {/* ========================================================= */}
      {/*                     HERO HEADER                           */}
      {/* ========================================================= */}
      <div className="mt-6 space-y-1">
        <p className="text-sm text-slate-400 tracking-wide">
          Bonjour {firstName.charAt(0).toUpperCase() + firstName.slice(1)} 👋
        </p>

        <h1 className="text-4xl font-bold text-[#D4AF37] tracking-wide leading-tight">
          Acceptez des livraisons et gagnez de l’argent
        </h1>
      </div>

      {/* ========================================================= */}
      {/*                        ACTION CARDS                       */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* CARD 1 — OPEN REQUESTS */}
        <div
          onClick={() => setShowOpenRequests(!showOpenRequests)}
          className="bg-[#13151A] border border-slate-700 rounded-2xl p-6 cursor-pointer hover:border-[#D4AF37] transition-all shadow-md flex justify-between"
        >
          <div>
            <h3 className="text-[#D4AF37] text-xl font-semibold mb-1">
              Livraisons disponibles
            </h3>
            <p className="text-slate-400 text-sm">
              Voir les livraisons en attente.
            </p>
          </div>

          <span className="text-[#D4AF37] text-xl">
            {showOpenRequests ? "▾" : "▸"}
          </span>
        </div>

        {/* CARD 2 — APPLICATIONS */}
        <div
          onClick={() => setShowApplications(!showApplications)}
          className="bg-[#13151A] border border-slate-700 rounded-2xl p-6 cursor-pointer hover:border-[#D4AF37] transition-all shadow-md flex justify-between"
        >
          <div>
            <h3 className="text-[#D4AF37] text-xl font-semibold mb-1">
              Mes candidatures
            </h3>
            <p className="text-slate-400 text-sm">
              Suivre vos demandes envoyées.
            </p>
          </div>

          <span className="text-[#D4AF37] text-xl">
            {showApplications ? "▾" : "▸"}
          </span>
        </div>

      </div>

      {/* ========================================================= */}
      {/*                 EXPANDABLE — OPEN REQUESTS                */}
      {/* ========================================================= */}
      {showOpenRequests && (
        <div className="space-y-4">
          {openRequests.length === 0 && (
            <p className="text-slate-400 text-sm">Aucune livraison disponible.</p>
          )}

          {openRequests.map(req => (
            <div
              key={req.id}
              className="bg-[#13151A] border border-slate-700 rounded-2xl p-5 hover:border-[#D4AF37] transition-all"
            >
              <p className="text-[#D4AF37] font-semibold text-sm">
                {req.pickup_location} → {req.dropoff_location}
              </p>

              <p className="text-xs text-slate-400 mt-1">{req.item_description}</p>

              <p className="text-[10px] text-slate-500 mt-1">
                {new Date(req.created_at).toLocaleString()}
              </p>

              <div className="mt-3 text-right">
                <p className="text-[#D4AF37] font-semibold text-sm">
                  {req.budget?.toLocaleString('fr-FR')} FCFA
                </p>

                <Link
                  href={`/requests/${req.id}`}
                  className="inline-block mt-2 bg-[#D4AF37] text-black px-4 py-2 text-xs rounded-xl hover:bg-[#be9d31]"
                >
                  Voir & postuler
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/*                 EXPANDABLE — APPLICATIONS                 */}
      {/* ========================================================= */}
      {showApplications && (
        <div className="space-y-4 pb-4">
          {myApplications.length === 0 && (
            <p className="text-slate-400 text-sm">Aucune candidature envoyée.</p>
          )}

          {myApplications.map(app => {
            const rating = ratingsMap[app.request?.id];

            return (
              <div
                key={app.id}
                className="bg-[#13151A] border border-slate-700 rounded-2xl p-5 hover:border-[#D4AF37] transition-all"
              >
                <p className="text-[#D4AF37] font-semibold text-sm">
                  {app.request?.pickup_location} → {app.request?.dropoff_location}
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  {app.request?.item_description}
                </p>

                {/* Customer Profile Link */}
                <p
                  className="text-xs text-[#D4AF37] underline mt-1 cursor-pointer"
                  onClick={() => router.push(`/profile/customer?id=${app.request?.customer_id}`)}
                >
                  Voir le profil du client
                </p>

                {/* STATUS */}
                <span
                  className={`inline-block mt-2 px-3 py-1 rounded-xl text-xs font-semibold ${
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

                {app.offer_price && (
                  <p className="text-xs text-[#D4AF37] mt-2">
                    Offre : {app.offer_price.toLocaleString("fr-FR")} FCFA
                  </p>
                )}

                <Link
                  href={`/requests/${app.request?.id}`}
                  className="block text-xs text-[#D4AF37] mt-2 underline"
                >
                  Ouvrir la demande
                </Link>

                {rating && (
                  <div className="mt-3 p-3 bg-[#0B0C10] border border-slate-700 rounded-xl">
                    <p className="text-xs text-slate-300 font-semibold">Note du client :</p>
                    <p className="text-[#D4AF37] text-lg mt-1">
                      {'★'.repeat(rating.rating)}{'☆'.repeat(5 - rating.rating)}
                    </p>
                    {rating.review && (
                      <p className="text-xs text-slate-400 mt-1 italic">“{rating.review}”</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/*                     IMAGE SECTION ADDED                   */}
      {/* ========================================================= */}
      <div className="space-y-6 mt-10 pb-14">

        {/* Basilica */}
        <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-700">
          <img src="/basilica.jpg" alt="Yamoussoukro Basilica" className="w-full object-cover opacity-90" />
        </div>

        {/* Abidjan Blue Skyline */}
        <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-700">
          <img src="/abidjan-blue.jpg" alt="Abidjan Skyline" className="w-full object-cover opacity-90" />
        </div>

        {/* Abidjan Purple Skyline */}
        <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-700">
          <img src="/abidjan-purple.jpg" alt="Abidjan Night" className="w-full object-cover opacity-90" />
        </div>

        {/* Delivery Scooter Icon */}
        <div className="flex justify-center py-4">
          <img src="/delivery-scooter.jpg" alt="Delivery Scooter" className="w-32 h-32 opacity-80" />
        </div>

      </div>

    </div>
  );
}
