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

function getPublicParticipationMessage(count) {
  if (count === 0) return "Soyez le premier à participer !";
  if (count < 3) return "Quelques personnes ont déjà contribué.";
  if (count < 7) return "La cagnotte commence à attirer du monde.";
  return "Beaucoup d'intérêt autour de cette cagnotte.";
}

// ★ NEW: Beautiful status badges
function StatusBadge({ status, deadlinePassed }) {
  if (status === "completed")
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

export default function CagnotteDetails() {
  const router = useRouter();
  const { id, token } = router.query;

  const [cagnotte, setCagnotte] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [winnerProfile, setWinnerProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [countdown, setCountdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // LOAD EVERYTHING
  useEffect(() => {
    if (!id) return;

    async function loadData() {
      setLoading(true);

      const { data: auth } = await supabase.auth.getUser();
      const currentUser = auth.user || null;
      setUser(currentUser);

      const { data: cag, error } = await supabase
        .from("cagnottes")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !cag) {
        setMsg("Erreur : cagnotte introuvable.");
        setLoading(false);
        return;
      }

      const isPrivate = !cag.is_public;
      const isCreator = currentUser && currentUser.id === cag.user_id;

      // PRIVATE + NOT LOGGED IN
      if (isPrivate && !currentUser) {
        setCagnotte(cag);
        setLoading(false);
        return;
      }

      // PRIVATE + LOGGED IN BUT NO TOKEN
      if (isPrivate && !isCreator) {
        if (!token || token !== cag.access_token) {
          setCagnotte(cag);
          setMsg("Cette cagnotte est privée. Lien invalide.");
          setLoading(false);
          return;
        }
      }

      setCagnotte(cag);

      // LOAD PARTICIPANTS
      const { data: parts } = await supabase
        .from("cagnottes_participants")
        .select("*")
        .eq("cagnotte_id", id);
      setParticipants(parts || []);

      // LOAD WINNER PROFILE IF EXISTS
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

    loadData();
  }, [id, token]);

  // COUNTDOWN
  useEffect(() => {
    if (!cagnotte) return;

    const d = parseDeadline(cagnotte.deadline);
    if (!d) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = d - now;

      if (diff <= 0) {
        setCountdown("Cagnotte fermée");
        clearInterval(interval);
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      setCountdown(`Temps restant : ${h}h ${m}min ${s}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [cagnotte]);

  if (loading)
    return (
      <div className="min-h-screen bg-[#0B0C10] text-slate-300 flex items-center justify-center">
        Chargement...
      </div>
    );

  if (!cagnotte)
    return (
      <div className="min-h-screen bg-[#0B0C10] text-red-400 text-center pt-10">
        {msg || "Erreur : Cagnotte introuvable."}
      </div>
    );

  const deadline = parseDeadline(cagnotte.deadline);
  const deadlinePassed = deadline <= new Date();
  const isCreator = user?.id === cagnotte.user_id;
  const isCompleted = cagnotte.status === "completed";
  const isPrivate = !cagnotte.is_public;

  // ======================================
  // PRIVATE VIEW (NOT LOGGED IN)
  // ======================================
  if (isPrivate && !user) {
    return (
      <div className="min-h-screen bg-[#0B0C10] text-white px-4 py-6">
        <h1 className="text-3xl font-bold text-[#D4AF37]">{cagnotte.title}</h1>
        <p className="text-sm text-gray-300">{cagnotte.purpose}</p>

        <div className="mt-6 bg-[#13151A] border border-red-600/50 p-4 rounded-xl">
          <p className="text-red-300 font-semibold">Cagnotte privée</p>
          <p className="text-gray-400 text-sm mt-2">
            Connectez-vous pour accéder aux détails.
          </p>
        </div>

        <button
          onClick={() =>
            router.push(
              `/auth?redirect=${encodeURIComponent(
                `/requests/cagnotte/${id}?token=${token || ""}`
              )}`
            )
          }
          className="w-full bg-[#D4AF37] text-black font-semibold rounded-lg py-2 mt-6"
        >
          Se connecter / S’inscrire
        </button>
      </div>
    );
  }

  // ======================================
  // PUBLIC VIEW (NOT LOGGED IN)
  // ======================================
  if (!user && cagnotte.is_public) {
    return (
      <div className="min-h-screen bg-[#0B0C10] text-white px-4 py-6">
        <h1 className="text-3xl font-bold text-[#D4AF37]">{cagnotte.title}</h1>
        <p className="text-sm text-gray-300">{cagnotte.purpose}</p>

        <p className="text-xs text-gray-400 mt-2">
          Clôture automatique : {deadline.toLocaleString()}
        </p>

        <p className="text-md font-semibold text-[#D4AF37] mt-2">
          {countdown}
        </p>

        <div className="mt-4 bg-[#13151A] border border-slate-700 rounded-lg p-4">
          <p className="text-gray-300 text-sm">
            {getPublicParticipationMessage(participants.length)}
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Connectez-vous pour participer.
          </p>
        </div>

        <button
          onClick={() =>
            router.push(
              `/auth?redirect=${encodeURIComponent(
                `/requests/cagnotte/${id}`
              )}`
            )
          }
          className="w-full bg-[#D4AF37] text-black py-2 mt-6 rounded-lg font-semibold"
        >
          Se connecter / S’inscrire
        </button>
      </div>
    );
  }

  // FULL LOGGED-IN VIEW
  async function contribute() {
    if (!user) return setMsg("Veuillez vous connecter.");
    if (deadlinePassed || isCompleted) return setMsg("Cagnotte fermée.");

    const { error } = await supabase.from("cagnottes_participants").insert([
      {
        cagnotte_id: cagnotte.id,
        user_id: user.id,
        contribution_amount: cagnotte.entry_price,
      },
    ]);

    if (error) return setMsg("Erreur contribution");

    const { data: parts } = await supabase
      .from("cagnottes_participants")
      .select("*")
      .eq("cagnotte_id", cagnotte.id);

    setParticipants(parts || []);
    setMsg("Contribution enregistrée !");
  }

  // ★★★ FIXED WINNER SELECTION ★★★
  async function selectWinner() {
    if (!isCreator) return setMsg("Action réservée au créateur.");
    if (!deadlinePassed) return setMsg("La cagnotte n'est pas terminée.");
    if (isCompleted) return setMsg("Un gagnant a déjà été sélectionné.");
    if (participants.length === 0) return setMsg("Aucun participant.");

    const winner =
      participants[Math.floor(Math.random() * participants.length)];

    // Update cagnotte
    const { data, error } = await supabase
      .from("cagnottes")
      .update({
        status: "completed",
        winner_id: winner.user_id,
      })
      .eq("id", cagnotte.id)
      .select()
      .single();

    if (error) {
      console.error("UPDATE ERROR:", error);
      return setMsg("Erreur lors de la sélection du gagnant.");
    }

    setCagnotte(data);

    // Fetch winner profile
    const { data: winProfile } = await supabase
      .from("profiles")
      .select("full_name, id")
      .eq("id", winner.user_id)
      .single();

    setWinnerProfile(winProfile);
    setMsg("🎉 Gagnant sélectionné !");
  }

  // MAKE PUBLIC
  async function makePublic() {
    if (!isCreator) return;
    const { data } = await supabase
      .from("cagnottes")
      .update({ is_public: true, access_token: null })
      .eq("id", cagnotte.id)
      .single();
    setCagnotte(data);
    setMsg("Cagnotte rendue publique !");
  }

  return (
    <div className="min-h-screen bg-[#0B0C10] text-white px-4 py-6">
      
      {/* HEADER */}
      <h1 className="text-3xl font-bold text-[#D4AF37]">{cagnotte.title}</h1>
      <p className="text-sm text-gray-300">{cagnotte.purpose}</p>

      <p className="text-xs text-gray-400 mt-2">
        Clôture automatique : {deadline.toLocaleString()}
      </p>

      <p className="text-md font-semibold text-[#D4AF37] mt-2">
        {countdown}
      </p>

      {/* STATUS BADGE */}
      <div className="mt-3">
        <StatusBadge status={cagnotte.status} deadlinePassed={deadlinePassed} />
      </div>

      {/* SHARE BUTTON */}
      <button
        className="w-full mt-4 bg-[#D4AF37] text-black font-semibold py-2 rounded-lg"
        onClick={async () => {
          const link = cagnotte.is_public
            ? `${window.location.origin}/requests/cagnotte/${cagnotte.id}`
            : `${window.location.origin}/requests/cagnotte/${cagnotte.id}?token=${cagnotte.access_token}`;

          await navigator.clipboard.writeText(link);
          setMsg("Lien copié !");
        }}
      >
        📤 Partager la cagnotte
      </button>

      {/* WINNER BOX */}
      {winnerProfile && (
        <div className="mt-6 bg-[#13151A] border border-[#D4AF37]/60 p-4 rounded-xl">
          <h2 className="text-xl font-bold text-[#D4AF37]">🎉 Gagnant</h2>
          <p className="text-gray-200 mt-2">
            <span className="font-semibold text-[#D4AF37]">Nom :</span>{" "}
            {winnerProfile.full_name}
          </p>
          <p className="text-gray-400 text-sm">
            <span className="font-semibold text-[#D4AF37]">ID :</span>{" "}
            {winnerProfile.id}
          </p>
        </div>
      )}

      {/* MESSAGES */}
      {msg && (
        <p className="mt-3 text-center text-[#D4AF37] font-semibold">
          {msg}
        </p>
      )}

      {/* PARTICIPANTS SECTION */}
      <div className="mt-6 bg-[#13151A] border border-gray-700 rounded-xl p-4">
        <h2 className="text-lg font-bold text-[#D4AF37]">Participants</h2>

        {isCreator ? (
          <>
            <p className="text-[#D4AF37] font-semibold mt-2">
              {participants.length} contributions
            </p>

            <ul className="mt-3 space-y-1 text-sm text-gray-300">
              {participants.map((p) => (
                <li key={p.id}>
                  • {p.user_id} – {p.contribution_amount} FCFA
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-gray-300 mt-2">
            {getPublicParticipationMessage(participants.length)}
          </p>
        )}
      </div>

      {/* CONTRIBUTE BUTTON */}
      {!deadlinePassed && !isCompleted && (
        <button
          onClick={contribute}
          className="w-full mt-6 bg-[#D4AF37] text-black py-2 rounded-lg font-semibold"
        >
          Contribuer ({cagnotte.entry_price} FCFA)
        </button>
      )}

      {/* SELECT WINNER */}
      {isCreator && deadlinePassed && !isCompleted && participants.length > 0 && (
        <button
          onClick={selectWinner}
          className="w-full mt-4 bg-red-600 text-white py-2 rounded-lg font-semibold"
        >
          Sélectionner un gagnant
        </button>
      )}

      {/* MAKE PUBLIC */}
      {isCreator && isPrivate && (
        <button
          onClick={makePublic}
          className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg font-semibold"
        >
          Rendre publique
        </button>
      )}
    </div>
  );
}
