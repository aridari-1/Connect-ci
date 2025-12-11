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

      const isCreator = currentUser && currentUser.id === cag.user_id;
      const isPrivate = !cag.is_public;

      // PRIVATE CAGNOTTE — NOT LOGGED IN (MODE B)
      if (isPrivate && !currentUser) {
        setCagnotte(cag); // show only title + purpose
        setLoading(false);
        return;
      }

      // PRIVATE CAGNOTTE — LOGGED IN BUT NO TOKEN
      if (isPrivate && !isCreator) {
        if (!token || token !== cag.access_token) {
          setMsg("Cette cagnotte est privée. Veuillez vous connecter pour continuer.");
          setCagnotte(cag);
          setLoading(false);
          return;
        }
      }

      // LOAD EVERYTHING (ALLOWED)
      setCagnotte(cag);

      const { data: parts } = await supabase
        .from("cagnottes_participants")
        .select("*")
        .eq("cagnotte_id", id);
      setParticipants(parts || []);

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

  // COUNTDOWN
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
  const isPrivate = !cagnotte.is_public;

  // -------------------------
  // CONTRIBUTE
  // -------------------------
  async function contribute() {
    if (!user)
      return setMsg("Veuillez vous connecter pour contribuer.");

    if (deadlinePassed || isCompleted)
      return setMsg("La cagnotte est fermée.");

    if (isPersonal && isCreator)
      return setMsg("Vous êtes le bénéficiaire : vous ne pouvez pas contribuer.");

    const { error } = await supabase.from("cagnottes_participants").insert([
      {
        cagnotte_id: cagnotte.id,
        user_id: user.id,
        contribution_amount: cagnotte.entry_price,
      },
    ]);

    if (error) setMsg("Erreur : impossible de contribuer.");
    else {
      setMsg("Contribution enregistrée !");
      const { data } = await supabase
        .from("cagnottes_participants")
        .select("*")
        .eq("cagnotte_id", cagnotte.id);
      setParticipants(data || []);
    }
  }

  // -------------------------
  // SELECT WINNER
  // -------------------------
  async function selectWinner() {
    if (!isCreator) return setMsg("Action réservée au créateur.");
    if (!isCompetition) return setMsg("Cette cagnotte n'est pas un tirage au sort.");
    if (!deadlinePassed) return setMsg("La cagnotte n'est pas encore terminée.");
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

  // -------------------------
  // COLLECT PERSONAL CAGNOTTE
  // -------------------------
  async function collectCagnotte() {
    if (!isCreator) return setMsg("Action réservée au créateur.");
    if (!isPersonal) return setMsg("Cette cagnotte est un tirage au sort.");
    if (!deadlinePassed) return setMsg("La cagnotte n'est pas encore terminée.");
    if (isCompleted) return setMsg("Cette cagnotte est déjà clôturée.");

    const { data, error } = await supabase
      .from("cagnottes")
      .update({
        status: "completed",
        winner_id: cagnotte.user_id,
      })
      .eq("id", cagnotte.id)
      .single();

    if (error) return setMsg("Erreur lors de la clôture.");

    setCagnotte(data);

    const { data: winProfile } = await supabase
      .from("profiles")
      .select("full_name, id")
      .eq("id", cagnotte.user_id)
      .single();

    setWinnerProfile(winProfile || null);
    setMsg("Vous avez récupéré la cagnotte.");
  }

  // -------------------------
  // MAKE PUBLIC
  // -------------------------
  async function makePublic() {
    if (!isCreator) return;
    const { data, error } = await supabase
      .from("cagnottes")
      .update({ is_public: true, access_token: null })
      .eq("id", cagnotte.id)
      .single();

    if (error) return setMsg("Erreur.");
    setCagnotte(data);
    setMsg("Cagnotte rendue publique.");
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
          Fermée — En attente du gagnant
        </span>
      );

    return (
      <span className="bg-green-700/40 text-green-300 px-3 py-1 rounded-lg text-sm font-semibold">
        Ouverte
      </span>
    );
  }

  // -----------------------------------------
  // HEADER ALWAYS SHOWN (even for private)
  // -----------------------------------------
  return (
    <div className="min-h-screen bg-[#0B0C10] text-white px-4 py-6">
      <h1 className="text-3xl font-bold text-[#D4AF37]">{cagnotte.title}</h1>
      <p className="text-sm text-gray-300">{cagnotte.purpose}</p>

      {/* If NOT logged in + PRIVATE → show login requirement */}
      {isPrivate && !user && (
        <>
          <div className="mt-6 bg-[#13151A] border border-red-600/50 rounded-xl p-4">
            <p className="text-red-300 font-semibold">
              Cette cagnotte est privée.
            </p>
            <p className="text-gray-300 text-sm mt-2">
              Connectez-vous pour y accéder.
            </p>
          </div>

          <button
            onClick={() => router.push(`/auth?redirect=/requests/cagnotte/${id}?token=${token}`)}
            className="w-full mt-6 bg-[#D4AF37] text-black py-2 font-semibold rounded-lg"
          >
            Se connecter / S’inscrire
          </button>
        </>
      )}

      {/* STOP RENDERING PRIVATE CONTENT WHEN USER NOT LOGGED */}
      {isPrivate && !user && <></>}
      {isPrivate && !user && <></>}
      {isPrivate && !user && <>{/* do not render below sections */}</>}
      {isPrivate && !user && <>{/* END */}</>}

      {/* Continue rendering ONLY if logged in OR public */}
      {(user || cagnotte.is_public) && (
        <>
          {/* Deadline */}
          <p className="text-xs mt-2 text-gray-400">
            Clôture automatique : {deadline?.toLocaleString()}
          </p>

          <p className="text-md font-semibold mt-2 text-[#D4AF37]">
            {countdown}
          </p>

          {/* Status */}
          <div className="mt-3">
            <StatusBadge />
          </div>

          {/* Usage type banner */}
          <div className="mt-4 bg-[#13151A] border border-[#D4AF37]/40 rounded-lg p-3 text-xs">
            {isPersonal ? (
              <>
                <p className="text-[#D4AF37] font-semibold">
                  ⚠️ Cagnotte personnelle
                </p>
                <p className="text-gray-300 mt-1">
                  Les fonds sont destinés directement au créateur.
                </p>
              </>
            ) : (
              <>
                <p className="text-[#D4AF37] font-semibold">
                  🎯 Tirage au sort
                </p>
                <p className="text-gray-300 mt-1">
                  Un participant sera sélectionné comme gagnant.
                </p>
              </>
            )}
          </div>

          {/* Winner box */}
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

          {/* Share button */}
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

          {msg && (
            <p className="mt-3 text-center text-[#D4AF37] font-semibold bg-[#13151A] border border-[#D4AF37]/40 px-3 py-2 rounded-lg">
              {msg}
            </p>
          )}

          {/* Participants */}
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
            )}
          </div>

          {/* Contribute button */}
          {!deadlinePassed && !isCompleted && user && (
            <button
              onClick={contribute}
              className="w-full mt-6 bg-[#D4AF37] hover:bg-[#c29c2f] text-black font-semibold py-2 rounded-lg"
            >
              Contribuer ({cagnotte.entry_price} FCFA)
            </button>
          )}

          {/* Select winner */}
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

          {/* Collect for personal cagnotte */}
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

          {/* Make public */}
          {isCreator && isPrivate && (
            <button
              onClick={makePublic}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg"
            >
              Rendre publique
            </button>
          )}
        </>
      )}
    </div>
  );
}
