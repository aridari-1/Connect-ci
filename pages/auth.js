import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('customer'); // default role
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      if (mode === 'signup') {
        // Sign up new user
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        const user = data.user;
        if (user) {
          // Create profile with role
          const { error: profileError } = await supabase.from('profiles').insert({
            id: user.id,
            full_name: fullName || null,
            role,
            city: 'Abidjan',
          });
          if (profileError) throw profileError;
        }
        setMessage('Account created! You can now log in.');
        setMode('login');
      } else {
        // Log in existing user
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/post-request'); // redirect after login
      }
    } catch (err) {
      console.error(err);
      setMessage(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto bg-[#13151A] border border-slate-700 rounded-2xl shadow-sm p-6">
      {/* Toggle Buttons */}
      <div className="flex gap-2 mb-4">
        <button 
          type="button" 
          onClick={() => setMode('login')} 
          className={`flex-1 py-2 rounded-xl text-sm font-medium ${
            mode === 'login' ? 'bg-[#D4AF37] text-black' : 'bg-[#2e2e2e] text-slate-400'
          }`}
        >
          Log in
        </button>
        <button 
          type="button" 
          onClick={() => setMode('signup')} 
          className={`flex-1 py-2 rounded-xl text-sm font-medium ${
            mode === 'signup' ? 'bg-[#D4AF37] text-black' : 'bg-[#2e2e2e] text-slate-400'
          }`}
        >
          Sign up
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-4 text-[#D4AF37]">
        {mode === 'login' ? 'Log in to Connect' : 'Create your Connect account'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Full name</label>
              <input 
                className="w-full border border-slate-700 bg-[#0B0C10] text-slate-200 placeholder-slate-500 rounded-xl px-3 py-2 text-sm" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                placeholder="Ex: Kouassi Yao" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">I am a:</label>
              <select 
                className="w-full border border-slate-700 bg-[#0B0C10] text-slate-200 rounded-xl px-3 py-2 text-sm" 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="customer">Customer (needs delivery)</option>
                <option value="provider">Delivery helper</option>
              </select>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input 
            type="email" 
            className="w-full border border-slate-700 bg-[#0B0C10] text-slate-200 placeholder-slate-500 rounded-xl px-3 py-2 text-sm" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="you@example.com" 
            required 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input 
            type="password" 
            className="w-full border border-slate-700 bg-[#0B0C10] text-slate-200 placeholder-slate-500 rounded-xl px-3 py-2 text-sm" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="At least 6 characters" 
            required 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full rounded-xl bg-[#D4AF37] text-black py-2 text-sm font-semibold hover:bg-[#be9d31] disabled:opacity-60"
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Sign up'}
        </button>

        {message && (
          <p className="text-sm text-center mt-2 text-slate-300">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
