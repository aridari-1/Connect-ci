import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';

export default function PostRequest() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);

  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [item, setItem] = useState('');
  const [budget, setBudget] = useState('');
  const [timePref, setTimePref] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 1️⃣ Check auth status
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);
      setCheckingUser(false);
    }
    loadUser();
  }, []);

  // 2️⃣ Rating rule: ensure user rated previous tasks (if applicable)
  async function checkRatingRequirement() {
    const { data: completed } = await supabase
      .from('delivery_requests')
      .select('id')
      .eq('customer_id', user.id)
      .eq('status', 'completed');
    const completedCount = completed?.length || 0;
    if (completedCount < 2) return true;
    const { data: ratings } = await supabase
      .from('ratings')
      .select('request_id')
      .in('request_id', completed.map(r => r.id));
    const ratedCount = ratings?.length || 0;
    if (completedCount >= 2 && ratedCount === 0) {
      alert("⛔ Please rate your first completed delivery before posting another request.");
      return false;
    }
    return true;
  }

  // 3️⃣ Submit new request
  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    if (!user) {
      setMessage('You must be logged in to post a request.');
      setLoading(false);
      return;
    }
    const allowed = await checkRatingRequirement();
    if (!allowed) {
      setLoading(false);
      return;
    }
    const { error } = await supabase.from('delivery_requests').insert({
      customer_id: user.id,
      pickup_location: pickup,
      dropoff_location: dropoff,
      item_description: item,
      budget: budget ? Number(budget) : null,
      time_preference: timePref,
      city: 'Abidjan',
    });
    if (error) {
      console.error(error);
      setMessage('Error posting request. Please try again.');
    } else {
      setMessage('Request posted! Delivery helpers will see it soon.');
      // Reset form fields
      setPickup(''); setDropoff(''); setItem(''); setBudget(''); setTimePref('');
    }
    setLoading(false);
  }

  // 4️⃣ Unauthenticated view
  if (checkingUser) {
    return <p className="text-sm text-slate-500">Checking your session...</p>;
  }
  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-[#13151A] border border-slate-700 p-6 rounded-xl shadow-sm">
        <h2 className="text-2xl font-semibold mb-2">You must be logged in</h2>
        <p className="text-sm text-slate-400 mb-4">
          Please log in or create an account to post a delivery request.
        </p>
        <button 
          onClick={() => router.push('/auth')} 
          className="w-full rounded-xl bg-[#D4AF37] text-black py-2 text-sm font-semibold hover:bg-[#be9d31]"
        >
          Go to login / signup
        </button>
      </div>
    );
  }

  // 5️⃣ Post Request Form (authenticated)
  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4 text-[#D4AF37]">Post a delivery request</h2>
      <form onSubmit={handleSubmit} className="space-y-4 bg-[#13151A] p-6 rounded-2xl shadow-sm border border-slate-700">
        <div>
          <label className="block text-sm font-medium mb-1">Pickup location</label>
          <input 
            className="w-full border border-slate-700 bg-[#0B0C10] text-slate-200 placeholder-slate-500 rounded-xl px-3 py-2 text-sm" 
            value={pickup} 
            onChange={(e) => setPickup(e.target.value)} 
            placeholder="Ex: Cocody Angré, 8e tranche" 
            required 
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Drop-off location</label>
          <input 
            className="w-full border border-slate-700 bg-[#0B0C10] text-slate-200 placeholder-slate-500 rounded-xl px-3 py-2 text-sm" 
            value={dropoff} 
            onChange={(e) => setDropoff(e.target.value)} 
            placeholder="Ex: Plateau, near Post Office" 
            required 
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">What needs to be delivered?</label>
          <textarea 
            className="w-full border border-slate-700 bg-[#0B0C10] text-slate-200 placeholder-slate-500 rounded-xl px-3 py-2 text-sm" 
            value={item} 
            onChange={(e) => setItem(e.target.value)} 
            placeholder="Ex: Documents, package, food, etc." 
            required 
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Budget (FCFA)</label>
            <input 
              type="number" 
              className="w-full border border-slate-700 bg-[#0B0C10] text-slate-200 placeholder-slate-500 rounded-xl px-3 py-2 text-sm" 
              value={budget} 
              onChange={(e) => setBudget(e.target.value)} 
              placeholder="Ex: 2000" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Preferred time</label>
            <input 
              className="w-full border border-slate-700 bg-[#0B0C10] text-slate-200 placeholder-slate-500 rounded-xl px-3 py-2 text-sm" 
              value={timePref} 
              onChange={(e) => setTimePref(e.target.value)} 
              placeholder="Ex: Today before 17:00" 
            />
          </div>
        </div>
        <button 
          type="submit" 
          disabled={loading} 
          className="w-full rounded-xl bg-[#D4AF37] text-black py-2 text-sm font-semibold hover:bg-[#be9d31] disabled:opacity-60"
        >
          {loading ? 'Posting...' : 'Post request'}
        </button>
        {message && (
          <p className="text-center text-sm mt-2">{message}</p>
        )}
      </form>
    </div>
  );
}
