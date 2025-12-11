// pages/requests/cagnotte/[id].js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";

function parseDeadline(dateStr) {
  if (!dateStr) return null;
  const iso = dateStr.replace(" ", "T");
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

export default function CagnotteDetails() {
  const router = useRouter();
  const { id } = router.query;

  const [cagnotte, setCagnotte] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [winnerProfile, setWinnerProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [countdown, setCountdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // -----------------------------------------------------------
  // LOAD USER + CAGNOTTE + PARTICIPANTS
  // -----------------------------------------------------------
  useEffect(() => {
    if (!id) return;

    async function loadAll() {
      setLoading(true);

      const { data: auth } = await supabase.auth.getUser();
      setUser(auth.user || null);

      const { data: cag } = await supabase
        .from("cagnottes")
        .select("*")
        .eq("id", id)
        .single();

      if (!cag) {
        setMsg("Erreur : cagnotte introuvable.");
        setLoading(false);
        return;
      }

      setCagnotte(cag);

      // Load participants
      const { data: parts } = await supabase
        .from("cagnottes_participants")
        .select("*")
        .eq("cagnotte_id", id);

      setParticipants(parts || []);

      // Load winner profile if exists
      if (cag.winner_id) {
        const { data: win } = await supabase
          .from("profiles")
          .select("full_name, id")
          .eq("id", cag.winner_id)
          .single();
        setWinnerProfile(win || null);
      }

      setLoading(false);
    }

    loadAll();
  }, [id]);

  // -----------------------------------------------------------
  // LIVE COUNTDOWN
  // -----------------------------------------------------------
  useEffect(() => {
    if (!cagnotte) return;

    const deadlineDate = parseDeadline(cagnotte.deadline);
    if (!deadlineDate) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = deadlineDate - now;

      if (diff <= 0) {
        setCountdown("Cagnotte fermée");
        clearInterval(interval);
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);

      setCountdown(`Temps restant : ${h}h ${m}min ${s}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [cagnotte]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-300">
        Chargement...
      </div>
    );
  }

  if (!cagnotte) {
    return (
      <div className="min-h-screen bg-black text-red-400 pt-10 text-center">
        Erreur : Cagnotte introuvable.
      </div>
    );
  }

  const deadline = parseDeadline(cagnotte.deadline);
  const deadlinePassed = deadline <= new Date();
  const isCreator = user?.id === cagnotte.user_id;
  const isCompleted = cagnotte.status === "completed";

  // -----------------------------------------------------------
  // CONTRIBUTE
  // -----------------------------------------------------------
  async function contribute() {
    if (deadlinePassed || isCompleted) {
      setMsg("La cagnotte est fermée.");
      return;
    }

    const { error } = await supabase.from("cagnottes_participants").insert([
      {
        cagnotte_id: cagnotte.id,
        user_id: user.id,
        contribution_amount: cagnotte.entry_price,
      },
    ]);

    if (error) {
      setMsg("Erreur : Impossible de contribuer.");
    } else {
      setMsg("Contribution enregistrée !");

      const { data } = await supabase
        .from("cagnottes_participants")
        .select("*")
        .eq("cagnotte_id", cagnotte.id);

      setParticipants(data);
    }
  }

  // -----------------------------------------------------------
  // SELECT WINNER
  // -----------------------------------------------------------
  async function selectWinner() {
    if (!isCreator) {
      setMsg("Seul le créateur peut sélectionner un gagnant.");
      return;
    }
    if (!deadlinePassed) {
      setMsg("La cagnotte n'est pas encore terminée.");
      return;
    }
    if (isCompleted) {
      setMsg("Un gagnant a déjà été sélectionné.");
      return;
    }
    if (participants.length === 0) {
      setMsg("Aucun participant !");
      return;
    }

    const winner =
      participants[Math.floor(Math.random() * participants.length)];

    const { data, error } = await supabase
      .from("cagnottes")
      .update({
        winner_id: winner.user_id,
        status: "completed",
      })
      .eq("id", cagnotte.id)
      .select("*")
      .single();

    if (error) {
      setMsg("Erreur lors de la sélection du gagnant.");
    } else {
      setMsg("🎉 Gagnant sélectionné !");

      // Load winner profile
      const { data: winProfile } = await supabase
        .from("profiles")
        .select("full_name, id")
        .eq("id", winner.user_id)
        .single();

      setWinnerProfile(winProfile);
      setCagnotte(data);
    }
  }

  // -----------------------------------------------------------
  // BADGE COMPONENT
  // -----------------------------------------------------------
  function StatusBadge() {
    if (isCompleted)
      return (
        <span className="bg-emerald-700/40 text-emerald-300 px-3 py-1 rounded-lg text-sm font-semibold">
          🎉 Gagnant sélectionné
        </span>
      );

    if (deadlinePassed)
      return (
        <span className="bg-yellow-700/40 text-yellow-300 px-3 py-1 rounded-lg text-sm font-semibold">
          Fermée — En attente du gagnant
        </span>
      );

    return (
      <span className="bg-green-700/40 text-green-300 px-3 py-1 rounded-lg text-sm font-semibold">
        Ouverte
      </span>
    );
  }

  // -----------------------------------------------------------
  // UI RENDER
  // -----------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0B0C10] text-white px-4 py-6">
      
      {/* TITLE */}
      <h1 className="text-3xl font-bold text-[#D4AF37]">{cagnotte.title}</h1>
      <p className="text-sm text-gray-300">{cagnotte.purpose}</p>

      {/* DEADLINE */}
      <p className="text-xs mt-2 text-gray-400">
        Clôture automatique : {deadline?.toLocaleString()}
      </p>

      {/* COUNTDOWN */}
      <p className="text-md font-semibold mt-2 text-[#D4AF37]">
        {countdown}
      </p>

      {/* STATUS BADGE */}
      <div className="mt-3">
        <StatusBadge />
      </div>

      {/* WINNER */}
      {winnerProfile && (
        <div className="mt-6 bg-[#13151A] border border-[#D4AF37]/60 p-4 rounded-xl">
          <h2 className="text-xl font-bold text-[#D4AF37]">🎉 Gagnant</h2>
          <p className="text-gray-200 mt-2">
            <span className="font-semibold text-[#D4AF37]">Nom :</span> {winnerProfile.full_name}
          </p>
          <p className="text-gray-400 text-sm">
            <span className="font-semibold text-[#D4AF37]">ID :</span> {winnerProfile.id}
          </p>
        </div>
      )}

      {/* MESSAGE */}
      {msg && <p className="mt-3 text-center text-red-400">{msg}</p>}

      {/* PARTICIPANTS */}
      <div className="mt-6 bg-[#13151A] border border-gray-700 rounded-xl p-4">
        <h2 className="text-lg font-bold text-[#D4AF37]">Participants</h2>

        {participants.length === 0 ? (
          <p className="text-gray-400 text-sm mt-2">Aucun participant.</p>
        ) : (
          <ul className="mt-3 space-y-1 text-sm text-gray-300">
            {participants.map((p) => (
              <li key={p.id}>
                • {p.user_id} – {p.contribution_amount} FCFA
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* CONTRIBUTE BUTTON */}
      {!deadlinePassed && !isCompleted && user && (
        <button
          onClick={contribute}
          className="w-full mt-6 bg-[#D4AF37] hover:bg-[#c29c2f] text-black font-semibold py-2 rounded-lg"
        >
          Contribuer ({cagnotte.entry_price} FCFA)
        </button>
      )}

      {/* SELECT WINNER */}
      {isCreator && deadlinePassed && !isCompleted && (
        <button
          onClick={selectWinner}
          className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg"
        >
          Sélectionner un gagnant
        </button>
      )}
    </div>
  );
}
