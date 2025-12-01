import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function CustomerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <p className="text-sm text-slate-500">Chargement...</p>;
  }
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

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Dashboard Header */}
      <header className="bg-[#13151A] p-5 rounded-2xl shadow-md border border-slate-700">
        <h1 className="text-2xl font-semibold text-[#D4AF37]">Mes demandes de livraison</h1>
        <p className="text-sm text-slate-300">
          Suivez vos demandes, l’état des livraisons et vos conversations.
        </p>
      </header>

      {requests.length === 0 && (
        <p className="text-sm text-slate-400">
          Vous n’avez pas encore publié de demande.
        </p>
      )}

      <div className="space-y-4">
        {requests.map((req) => (
          <div 
            key={req.id} 
            className="bg-[#13151A] rounded-2xl p-5 shadow-md border border-slate-700 hover:border-[#D4AF37] transition-all"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-sm text-[#D4AF37]">
                  {req.pickup_location} → {req.dropoff_location}
                </p>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {req.item_description}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {new Date(req.created_at).toLocaleString()}
                </p>
              </div>
              {/* Status Badge */}
              <span
                className={`text-xs px-3 py-1 rounded-xl font-semibold ${
                  req.status === 'open'
                    ? 'border border-amber-500 text-amber-500 bg-amber-500/10'
                    : req.status === 'assigned'
                    ? 'border border-blue-500 text-blue-500 bg-blue-500/10'
                    : req.status === 'completed'
                    ? 'border border-emerald-500 text-emerald-500 bg-emerald-500/10'
                    : 'border border-slate-500 text-slate-500 bg-slate-500/10'
                }`}
              >
                {req.status === 'open'
                  ? 'Ouverte'
                  : req.status === 'assigned'
                  ? 'Assignée'
                  : req.status === 'completed'
                  ? 'Terminée'
                  : req.status}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              Candidatures : <span className="font-semibold">{req.applications?.[0]?.count || 0}</span>
            </p>

            <div className="flex gap-3 mt-4">
              <Link 
                href={`/requests/${req.id}`} 
                className="flex-1 bg-[#D4AF37] text-black text-center py-2 rounded-xl text-sm font-medium shadow-md hover:bg-[#be9d31]"
              >
                Voir
              </Link>
              {req.status === 'assigned' && (
                <Link 
                  href={`/requests/${req.id}#chat`} 
                  className="flex-1 border border-[#D4AF37] text-[#D4AF37] text-center py-2 rounded-xl text-sm font-medium hover:bg-[#D4AF37] hover:text-black"
                >
                  Chat
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
