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

// Public-view participation messages
function getPublicParticipationMessage(count) {
  if (count === 0) return "Soyez le premier à participer !";
  if (count < 3) return "Quelques personnes ont déjà contribué.";
  if (count < 7) return "La cagnotte commence à attirer du monde.";
  return "Beaucoup d'intérêt autour de cette cagnotte.";
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

  useEffect(() => {
    if (!id) return;

    async function loadAll() {
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

      // PRIVATE ACCESS CONTROL
      const isCreator = currentUser && currentUser.id === cag.user_id;

      if (!cag.is_public && !isCreator) {
        if (!token || token !== cag.access_token) {
          setMsg("Cette cagnotte est privée. Accès refusé.");
          setLoading(false);
          return;
        }
      }

      setCagnotte(cag);

      // Load participants
      const { data: parts } = await supabase
        .from("cagnottes_participants")
        .select("*")
        .eq("cagnotte_id", id);

      setParticipants(parts || []);

      // Load winner profile
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
  }, [id, token]);

  // COUNTDOWN CLOCK
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
      <div className="min-h-screen flex items-center justify-center text-slate-300 bg-[#0B0C10]">
        Chargement...
      </div>
    );
  }

  if (!cagnotte) {
    return (
      <div className="min-h-screen bg-[#0B0C10] text-red-400 pt-10 text-center">
        {msg || "Erreur : Cagnotte introuvable."}
      </div>
    );
  }

  const deadline = parseDeadline(cagnotte.deadline);
  const deadlinePassed = deadline ? deadline <= new Date() : false;
  const isCreator = user?.id === cagnotte.user_id;
  const isCompleted = cagnotte.status === "completed";
  const isPersonal = cagnotte.usage_type === "personal";
  const isCompetition = cagnotte.usage_type === "competition";

  async function contribute() {
    if (!user) return setMsg("Vous devez être connecté pour contribuer.");
    if (deadlinePassed || isCompleted) return setMsg("La cagnotte est fermée.");

    if (isPersonal && isCreator) {
      return setMsg(
        "Vous êtes le bénéficiaire de cette cagnotte, vous ne pouvez pas y contribuer."
      );
    }

    const { error } = await supabase.from("cagnottes_participants").insert([
      {
        cagnotte_id: cagnotte.id,
        user_id: user.id,
        contribution_amount: cagnotte.entry_price,
      },
    ]);

    if (error) {
      setMsg("Erreur : impossible de contribuer.");
      console.error(error);
    } else {
      setMsg("Contribution enregistrée !");
      const { data } = await supabase
        .from("cagnottes_participants")
        .select("*")
        .eq("cagnotte_id", cagnotte.id);
      setParticipants(data || []);
    }
  }

  async function selectWinner() {
    if (!isCreator) return setMsg("Seul le créateur peut sélectionner un gagnant.");
    if (!isCompetition)
      return setMsg(
        "Cette cagnotte est personnelle. Aucun gagnant aléatoire ne peut être sélectionné."
      );
    if (!deadlinePassed)
      return setMsg("La cagnotte n'est pas encore terminée.");
    if (isCompleted) return setMsg("Un gagnant a déjà été sélectionné.");
    if (participants.length === 0) return setMsg("Aucun participant.");

    const winner = participants[Math.floor(Math.random() * participants.length)];

    const { data, error } = await supabase
      .from("cagnottes")
      .update({
        winner_id: winner.user_id,
        status: "completed",
      })
      .eq("id", cagnotte.id)
      .single();

    if (error) return setMsg("Erreur lors de la sélection.");

    setCagnotte(data);

    const { data: winProfile } = await supabase
      .from("profiles")
      .select("full_name, id")
      .eq("id", winner.user_id)
      .single();

    setWinnerProfile(winProfile || null);
    setMsg("🎉 Gagnant sélectionné !");
  }

  async function collectCagnotte() {
    if (!isCreator)
      return setMsg("Seul le créateur peut récupérer cette cagnotte.");
    if (!isPersonal)
      return setMsg(
        "Cette cagnotte est une cagnotte compétition. Utilisez le tirage au sort."
      );
    if (!deadlinePassed)
      return setMsg("La cagnotte n'est pas encore terminée.");
    if (isCompleted) return setMsg("Cette cagnotte est déjà clôturée.");

    const { data, error } = await supabase
      .from("cagnottes")
      .update({
        status: "completed",
        winner_id: cagnotte.user_id, // le créateur est le bénéficiaire
      })
      .eq("id", cagnotte.id)
      .single();

    if (error) return setMsg("Erreur lors de la clôture de la cagnotte.");

    setCagnotte(data);

    const { data: winProfile } = await supabase
      .from("profiles")
      .select("full_name, id")
      .eq("id", cagnotte.user_id)
      .single();

    setWinnerProfile(winProfile || null);
    setMsg("La cagnotte a été clôturée pour le créateur.");
  }

  async function makePublic() {
    if (!isCreator) return;

    const { data, error } = await supabase
      .from("cagnottes")
      .update({ is_public: true })
      .eq("id", cagnotte.id)
      .single();

    if (error) return setMsg("Erreur lors du passage en public.");

    setCagnotte(data);
    setMsg("Cette cagnotte est maintenant publique.");
  }

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
          Fermée — En attente du gagnant ou de la clôture
        </span>
      );

    return (
      <span className="bg-green-700/40 text-green-300 px-3 py-1 rounded-lg text-sm font-semibold">
        Ouverte
      </span>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0C10] text-white px-4 py-6">
      {/* HEADER */}
      <h1 className="text-3xl font-bold text-[#D4AF37]">{cagnotte.title}</h1>
      <p className="text-sm text-gray-300">{cagnotte.purpose}</p>

      <p className="text-xs mt-2 text-gray-400">
        Clôture automatique : {deadline?.toLocaleString()}
      </p>

      <p className="text-md font-semibold mt-2 text-[#D4AF37]">
        {countdown}
      </p>

      {/* STATUS */}
      <div className="mt-3">
        <StatusBadge />
      </div>

      {/* USAGE TYPE BANNER */}
      <div className="mt-4 bg-[#13151A] border border-[#D4AF37]/40 rounded-lg p-3 text-xs">
        {isPersonal && (
          <>
            <p className="text-[#D4AF37] font-semibold">
              ⚠️ Cagnotte personnelle
            </p>
            <p className="text-gray-300 mt-1">
              Cette cagnotte est destinée directement au créateur. En
              contribuant, vous l&apos;aidez à financer son objectif (concert,
              vêtements, livres, etc.).
            </p>
            {isCreator && (
              <p className="text-emerald-300 mt-1">
                Vous êtes le bénéficiaire de cette cagnotte.
              </p>
            )}
          </>
        )}

        {isCompetition && (
          <>
            <p className="text-[#D4AF37] font-semibold">
              🎯 Cagnotte compétition / tirage au sort
            </p>
            <p className="text-gray-300 mt-1">
              Cette cagnotte fonctionne comme un tirage au sort. Un participant
              sera sélectionné comme gagnant à la fin.
            </p>
          </>
        )}
      </div>

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

      {/* SHARE BUTTON */}
      <button
        onClick={async () => {
          const baseUrl =
            typeof window !== "undefined"
              ? window.location.origin
              : "https://connect-ci.app";

          const shareLink = cagnotte.is_public
            ? `${baseUrl}/requests/cagnotte/${cagnotte.id}`
            : `${baseUrl}/requests/cagnotte/${cagnotte.id}?token=${cagnotte.access_token}`;

          try {
            await navigator.clipboard.writeText(shareLink);
            setMsg("Lien copié dans le presse-papier !");
          } catch {
            setMsg("Impossible de copier le lien.");
          }
        }}
        className="w-full mt-4 bg-[#D4AF37] hover:bg-[#caa12f] text-black font-semibold py-2 rounded-lg"
      >
        📤 Partager la cagnotte
      </button>

      {/* MESSAGE */}
      {msg && (
        <p className="mt-3 text-center text-[#D4AF37] font-semibold bg-[#13151A] border border-[#D4AF37]/40 px-3 py-2 rounded-lg">
          {msg}
        </p>
      )}

      {/* PARTICIPANTS SECTION */}
      <div className="mt-6 bg-[#13151A] border border-gray-700 rounded-xl p-4">
        <h2 className="text-lg font-bold text-[#D4AF37]">Participants</h2>

        {!isCreator && (
          <p className="text-gray-400 text-sm mt-2 italic">
            {getPublicParticipationMessage(participants.length)}
          </p>
        )}

        {isCreator && (
          <>
            <p className="text-[#D4AF37] font-semibold mt-2">
              Nombre total de contributions : {participants.length}
            </p>

            <ul className="mt-3 space-y-1 text-sm text-gray-300">
              {participants.map((p) => (
                <li key={p.id}>
                  • {p.user_id} – {p.contribution_amount} FCFA
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* CONTRIBUTE */}
      {!deadlinePassed && !isCompleted && user && (
        <button
          onClick={contribute}
          className="w-full mt-6 bg-[#D4AF37] hover:bg-[#c29c2f] text-black font-semibold py-2 rounded-lg"
        >
          Contribuer ({cagnotte.entry_price} FCFA)
        </button>
      )}

      {/* SELECT WINNER (competition only) */}
      {isCreator &&
        isCompetition &&
        deadlinePassed &&
        !isCompleted &&
        participants.length > 0 && (
          <button
            onClick={selectWinner}
            className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg"
          >
            Sélectionner un gagnant
          </button>
        )}

      {/* COLLECT CAGNOTTE (personal only) */}
      {isCreator &&
        isPersonal &&
        deadlinePassed &&
        !isCompleted &&
        participants.length > 0 && (
          <button
            onClick={collectCagnotte}
            className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg"
          >
            Récupérer la cagnotte
          </button>
        )}

      {/* MAKE PUBLIC */}
      {isCreator && !cagnotte.is_public && (
        <button
          onClick={makePublic}
          className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg"
        >
          Rendre publique
        </button>
      )}
    </div>
  );
}
