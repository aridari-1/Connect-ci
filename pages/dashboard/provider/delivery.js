// FILE: provider.js
// (Only image section updated → horizontal scroll, uniform size)

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
        ratingsData?.forEach(r => (map[r.request_id] = r));
        setRatingsMap(map);
      }
    }

    loadData();
  }, [user]);

  if (loading || checkingRole)
    return <p className="text-sm text-slate-500 px-4 pt-24">Chargement...</p>;

  const firstName = user.email ? user.email.split('@')[0] : "Utilisateur";

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4 pb-28 space-y-8">

      {/* HERO */}
      <div className="mt-6 space-y-1">
        <p className="text-sm text-slate-400 tracking-wide">
          Bonjour {firstName.charAt(0).toUpperCase() + firstName.slice(1)} 👋
        </p>

        <h1 className="text-4xl font-bold text-[#D4AF37] tracking-wide leading-tight">
          Acceptez des livraisons et gagnez de l’argent
        </h1>
      </div>

      {/* ========================================================= */}
      {/* ⭐ HORIZONTAL IMAGES (NEW) */}
      {/* ========================================================= */}
      <div className="overflow-x-auto flex gap-4 py-4 no-scrollbar">

        {[
          "/basilica.jpg",
          "/abidjan-blue.jpg",
          "/abidjan-purple.jpg",
          "/delivery-scooter.jpg",
        ].map((src, idx) => (
          <div
            key={idx}
            className="flex-shrink-0 w-[180px] h-[110px] rounded-xl overflow-hidden border border-[#D4AF37]/40 shadow-md"
          >
            <img
              src={src}
              className="w-full h-full object-cover"
              alt="provider gallery"
            />
          </div>
        ))}
      </div>

      {/* ACTION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => setShowOpenRequests(!showOpenRequests)}
          className="bg-[#13151A] border border-slate-700 rounded-2xl p-6 cursor-pointer hover:border-[#D4AF37] transition-all shadow-md flex justify-between"
        >
          <div>
            <h3 className="text-[#D4AF37] text-xl font-semibold mb-1">
              Livraisons disponibles
            </h3>
            <p className="text-slate-400 text-sm">Voir les livraisons en attente.</p>
          </div>

          <span className="text-[#D4AF37] text-xl">
            {showOpenRequests ? "▾" : "▸"}
          </span>
        </div>

        <div
          onClick={() => setShowApplications(!showApplications)}
          className="bg-[#13151A] border border-slate-700 rounded-2xl p-6 cursor-pointer hover:border-[#D4AF37] transition-all shadow-md flex justify-between"
        >
          <div>
            <h3 className="text-[#D4AF37] text-xl font-semibold mb-1">Mes candidatures</h3>
            <p className="text-slate-400 text-sm">Suivre vos demandes envoyées.</p>
          </div>

          <span className="text-[#D4AF37] text-xl">
            {showApplications ? "▾" : "▸"}
          </span>
        </div>
      </div>

      {/* OPEN REQUESTS */}
      {showOpenRequests && (
        <div className="space-y-4">{/* unchanged code */}</div>
      )}

      {/* APPLICATIONS */}
      {showApplications && (
        <div className="space-y-4 pb-4">{/* unchanged code */}</div>
      )}

    </div>
  );
}
