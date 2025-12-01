import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function RequestsList() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    async function loadRequests() {
      const { data, error } = await supabase
        .from('delivery_requests')
        .select('*')
        .eq('city', 'Abidjan')
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      if (!error) setRequests(data || []);
    }
    loadRequests();
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-[#D4AF37]">Open delivery requests</h2>
      <p className="text-sm text-slate-400">
        These are new delivery requests posted by locals. Apply to any you can handle.
      </p>
      <div className="space-y-3">
        {requests.map((req) => (
          <Link 
            key={req.id} 
            href={`/requests/${req.id}`} 
            className="block bg-[#13151A] rounded-2xl shadow-sm p-4 border border-slate-700 hover:border-[#D4AF37]"
          >
            <div className="flex justify-between items-start gap-3">
              <div>
                <div className="text-sm font-semibold text-[#D4AF37]">
                  {req.pickup_location} → {req.dropoff_location}
                </div>
                <div className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {req.item_description}
                </div>
                {req.time_preference && (
                  <div className="text-xs text-slate-500 mt-1">
                    Time: {req.time_preference}
                  </div>
                )}
              </div>
              <div className="text-right">
                {req.budget && (
                  <div className="text-sm font-semibold text-[#D4AF37]">
                    {req.budget.toLocaleString('fr-FR')} FCFA
                  </div>
                )}
                <div className="text-[11px] text-slate-500 mt-1">
                  {new Date(req.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          </Link>
        ))}
        {requests.length === 0 && (
          <p className="text-sm text-slate-400">No open requests yet. Check back soon.</p>
        )}
      </div>
    </div>
  );
}
