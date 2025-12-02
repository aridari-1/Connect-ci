import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function ProviderProfile() {
  const router = useRouter();
  const { id } = router.query;

  const [profile, setProfile] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  // ⭐ Fetch provider profile
  useEffect(() => {
    if (!id) return;

    async function loadProfile() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      setProfile(data);
    }

    loadProfile();
  }, [id]);

  // ⭐ Fetch provider ratings
  useEffect(() => {
    if (!id) return;

    async function loadRatings() {
      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('provider_id', id);

      if (!error && data) setRatings(data);
      setLoading(false);
    }

    loadRatings();
  }, [id]);

  if (loading) {
    return (
      <div className="px-4 pt-20 pb-20">
        <p className="text-sm text-slate-500 text-center">Chargement du profil...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="px-4 pt-20 pb-20">
        <p className="text-sm text-red-500 text-center">Profil introuvable.</p>
      </div>
    );
  }

  // ⭐ Compute average rating
  const totalRatings = ratings.length;
  const avgRating = totalRatings > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
    : 0;

  // ⭐ Build star string for visual style
  function renderStars(value) {
    const full = Math.floor(value);
    const half = value % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);

    return (
      <>
        {"★".repeat(full)}
        {half ? "★" : ""}
        {"☆".repeat(empty)}
      </>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-[#13151A] rounded-2xl shadow-lg 
      p-5 sm:p-6 md:p-8 border border-slate-700 space-y-6 mt-4 mb-24">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <img
          src={profile.avatar_url || 'https://via.placeholder.com/80'}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border border-slate-600"
        />

        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#D4AF37]">
            {profile.full_name}
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
            {profile.transport_type || "Livreur"}
          </p>
        </div>
      </div>

      {/* ⭐ NEW: RATING DISPLAY */}
      <div className="bg-[#0B0C10] p-4 rounded-xl border border-slate-700 text-center">
        {totalRatings === 0 ? (
          <p className="text-slate-400 text-sm">Aucune note pour le moment</p>
        ) : (
          <div>
            <p className="text-xl text-[#D4AF37]">
              {renderStars(avgRating)}
            </p>
            <p className="text-sm text-slate-300 mt-1">
              {avgRating.toFixed(1)} — {totalRatings} avis
            </p>
          </div>
        )}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
        <div className="p-3 sm:p-4 bg-[#0B0C10] rounded-xl border border-slate-700">
          <p className="text-lg sm:text-xl font-semibold text-[#D4AF37]">
            {profile.completed_tasks || 0}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-400">Tâches</p>
        </div>

        <div className="p-3 sm:p-4 bg-[#0B0C10] rounded-xl border border-slate-700">
          <p className="text-lg sm:text-xl font-semibold text-[#D4AF37]">
            {totalRatings}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-400">Avis</p>
        </div>

        <div className="p-3 sm:p-4 bg-[#0B0C10] rounded-xl border border-slate-700">
          <p className="text-lg sm:text-xl font-semibold text-[#D4AF37]">Abidjan</p>
          <p className="text-[10px] sm:text-xs text-slate-400">Ville</p>
        </div>
      </div>

      {/* BIO */}
      <div className="bg-[#0B0C10] p-4 sm:p-5 rounded-xl border border-slate-700">
        <h3 className="text-lg sm:text-xl font-semibold text-[#D4AF37] mb-1">À propos</h3>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          {profile.bio || "Ce livreur n’a pas encore rédigé de bio."}
        </p>
      </div>

      {/* BACK BUTTON */}
      <button
        onClick={() => router.back()}
        className="w-full bg-[#D4AF37] text-black py-3 rounded-xl text-sm sm:text-base 
        font-semibold hover:bg-[#be9d31] active:scale-[0.98] transition"
      >
        Retour
      </button>
    </div>
  );
}
