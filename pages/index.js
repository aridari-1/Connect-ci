import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function Home() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        setUser(auth.user);
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', auth.user.id)
          .single();
        setProfile(prof);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading...</p>;
  }

  /* ---------- Unauthenticated Landing Page ---------- */
  if (!user) {
    return (
      <main className="min-h-screen bg-[#0B0C10] text-slate-200 p-6 flex flex-col justify-between">
        {/* Top Hero Section */}
        <div className="mt-10 text-center">
          <h1 className="text-4xl font-extrabold text-[#D4AF37] drop-shadow-md">Connect</h1>
          <p className="text-slate-300 text-sm mt-2 max-w-xs mx-auto">
            Nous connectons les habitants d’Abidjan à des livreurs fiables et rapides.
          </p>
        </div>
        {/* Call-to-Action Button */}
        <div className="mt-12 space-y-3">
          <Link 
            href="/auth" 
            className="block w-full bg-[#D4AF37] text-black font-semibold text-center py-3 rounded-xl shadow-md hover:bg-[#be9d31]"
          >
            Se connecter / Créer un compte
          </Link>
        </div>
        {/* Bottom Info Card */}
        <div className="mt-16 mb-6">
          <div className="bg-[#13151A]/90 backdrop-blur-sm shadow-lg rounded-3xl p-5 text-center border border-slate-700">
            <img 
              src="https://cdn-icons-png.flaticon.com/512/869/869636.png" 
              alt="Delivery Icon" 
              className="w-20 mx-auto mb-3 opacity-90" 
            />
            <p className="text-slate-300 text-sm font-medium">
              Simple, rapide et sécurisé — <br />
              Connect facilite vos livraisons au quotidien.
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* ---------- Profile Incomplete ---------- */
  if (!profile) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <h2 className="text-xl font-semibold">Bienvenue !</h2>
        <p>Veuillez compléter votre profil.</p>
        <Link href="/auth" className="text-[#D4AF37] underline">Aller au profil</Link>
      </div>
    );
  }

  /* ---------- Logged-in Homepage (Service Selection) ---------- */
  if (profile.role === 'customer') {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-[#D4AF37]">
          Quel service recherchez-vous aujourd’hui&nbsp;?
        </h1>
        <div className="grid gap-4">
          {/* Active Service Card */}
          <Link 
            href="/post-request" 
            className="block bg-[#13151A] border border-slate-700 rounded-xl p-4 hover:border-[#D4AF37]"
          >
            <h3 className="font-semibold text-lg text-[#D4AF37]">J’ai besoin d’une livraison</h3>
            <p className="text-sm text-slate-400">
              Demandez un livreur pour récupérer ou déposer un colis pour vous.
            </p>
          </Link>
          {/* Disabled Future Service Card */}
          <div className="block bg-[#13151A] border border-slate-700 rounded-xl p-4 opacity-50">
            <h3 className="font-semibold text-lg text-slate-400">Faniko (bientôt disponible)</h3>
            <p className="text-sm text-slate-500">Service de lessive + nettoyage bientôt.</p>
          </div>
        </div>
        <Link 
          href="/dashboard/customer" 
          className="inline-block border border-[#D4AF37] text-[#D4AF37] px-4 py-2 rounded-xl hover:bg-[#D4AF37] hover:text-black"
        >
          Voir mon tableau de bord
        </Link>
      </div>
    );
  }

  if (profile.role === 'provider') {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-[#D4AF37]">
          Tâches disponibles pour vous
        </h1>
        <div className="grid gap-4">
          {/* Active Service Card */}
          <Link 
            href="/requests" 
            className="block bg-[#13151A] border border-slate-700 rounded-xl p-4 hover:border-[#D4AF37]"
          >
            <h3 className="font-semibold text-lg text-[#D4AF37]">Livraisons disponibles</h3>
            <p className="text-sm text-slate-400">
              Consultez les demandes de livraison disponibles à Abidjan.
            </p>
          </Link>
          {/* Disabled Future Service Card */}
          <div className="block bg-[#13151A] border border-slate-700 rounded-xl p-4 opacity-50">
            <h3 className="font-semibold text-lg text-slate-400">Jobs Faniko (bientôt)</h3>
            <p className="text-sm text-slate-500">Bientôt vous pourrez accepter des tâches Faniko.</p>
          </div>
        </div>
        <Link 
          href="/dashboard/provider" 
          className="inline-block border border-[#D4AF37] text-[#D4AF37] px-4 py-2 rounded-xl hover:bg-[#D4AF37] hover:text-black"
        >
          Voir mon tableau de bord
        </Link>
      </div>
    );
  }

  return null;
}
