// pages/requests/hair/[id].js
// Détail d'une demande de coiffure – logique complète (candidatures, acceptation, rejet, chat, notes)

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";

// Traduction des statuts en français (affichage uniquement)
const statusLabels = {
  open: "Ouverte",
  pending: "En attente",
  assigned: "Assignée",
  accepted: "Acceptée",
  rejected: "Rejetée",
  completed: "Terminée",
};

/* ---------- Affichage global des notes pour une demande ---------- */
function RequestRatingDisplay({ requestId }) {
  const [ratingData, setRatingData] = useState(null);

  useEffect(() => {
    async function loadRating() {
      const { data, error } = await supabase
        .from("ratings")
        .select("rating, review, created_at, rated_user_role")
        .eq("request_id", requestId);

      if (!error && data) setRatingData(data);
    }
    loadRating();
  }, [requestId]);

  if (!ratingData || ratingData.length === 0) return null;

  return (
    <div className="mt-4 p-4 sm:p-5 bg-[#13151A] rounded-xl border border-slate-700">
      <p className="text-sm font-semibold text-slate-200">
        Avis et évaluations :
      </p>

      {ratingData.map((r, i) => (
        <div
          key={i}
          className="mt-3 pb-2 border-b border-slate-700 last:border-none"
        >
          <p className="text-xs text-slate-500">
            {r.rated_user_role === "provider"
              ? "Client → Prestataire"
              : "Prestataire → Client"}
          </p>

          <p className="text-[#D4AF37] text-xl mt-1">
            {"★".repeat(r.rating)}
            {"☆".repeat(5 - r.rating)}
          </p>

          {r.review && (
            <p className="text-sm text-slate-400 mt-1 italic">“{r.review}”</p>
          )}

          <p className="text-[10px] text-slate-500 mt-1">
            {new Date(r.created_at).toLocaleString("fr-FR")}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ---------- Chat intégré (même logique que la livraison) ---------- */
function Chat({ requestId, user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    async function loadMessages() {
      const { data } = await supabase
        .from("messages")
        .select(
          `
          id, content, sender_id, created_at,
          profiles:sender_id(full_name)
        `
        )
        .eq("request_id", requestId)
        .order("created_at", { ascending: true });

      if (data) setMessages(data);
    }

    loadMessages();

    const channel = supabase
      .channel(`messages_${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => setMessages((prev) => [...prev, payload.new])
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [requestId]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const { error } = await supabase.from("messages").insert({
      request_id: requestId,
      sender_id: user.id,
      content: newMessage.trim(),
    });

    if (error) {
      console.error("Erreur envoi message:", error);
      alert("Erreur lors de l'envoi du message.");
      return;
    }

    setNewMessage("");
  }

  return (
    <div className="bg-[#13151A] mt-6 p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-700">
      <h3 className="text-lg font-semibold mb-3">Chat</h3>

      <div className="h-64 sm:h-72 overflow-y-auto border border-slate-700 rounded-xl p-3 bg-[#0B0C10] space-y-3">
        {messages.length === 0 && (
          <p className="text-xs text-slate-500 text-center mt-5">
            Aucun message pour le moment.
          </p>
        )}

        {messages.map((msg) => {
          const mine = msg.sender_id === user.id;
          return (
            <div
              key={msg.id}
              className={`max-w-[80%] p-2 sm:p-3 rounded-xl text-sm ${
                mine
                  ? "ml-auto bg-[#D4AF37] text-black"
                  : "mr-auto bg-[#1a1d1f] border border-slate-700 text-slate-200"
              }`}
            >
              <p>{msg.content}</p>
              <p className="text-[10px] mt-1 opacity-70">
                {new Date(msg.created_at).toLocaleTimeString("fr-FR")}
              </p>
            </div>
          );
        })}
      </div>

      <form onSubmit={sendMessage} className="flex gap-2 mt-3">
        <input
          className="flex-1 border border-slate-700 rounded-xl px-3 py-2 text-sm bg-[#0B0C10] text-slate-200 placeholder-slate-500"
          placeholder="Écrire un message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />

        <button
          type="submit"
          className="rounded-xl bg-[#D4AF37] text-black px-4 py-2 text-sm font-medium hover:bg-[#be9d31]"
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}

/* ---------- Page principale ---------- */
export default function HairRequestDetail() {
  const router = useRouter();
  const { id } = router.query; // UUID de la demande

  const [request, setRequest] = useState(null);
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);

  const [applicationMessage, setApplicationMessage] = useState("");
  const [applicationPrice, setApplicationPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");

  const [checkingUser, setCheckingUser] = useState(true);

  // notation côté client → prestataire
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [hasRatedProvider, setHasRatedProvider] = useState(false);

  // notation côté prestataire → client
  const [providerRating, setProviderRating] = useState(0);
  const [providerReview, setProviderReview] = useState("");
  const [hasRatedCustomer, setHasRatedCustomer] = useState(false);

  /* ---------- Chargement utilisateur ---------- */
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);
      setCheckingUser(false);
    }
    loadUser();
  }, []);

  /* ---------- Chargement demande ---------- */
  useEffect(() => {
    if (!id) return;

    async function loadRequest() {
      const { data, error } = await supabase
        .from("hair_requests")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Erreur chargement demande:", error);
      }

      if (data) setRequest(data);
    }

    loadRequest();
  }, [id]);

  /* ---------- Chargement candidatures ---------- */
  async function loadApplications() {
    if (!id) return;

    const { data, error } = await supabase
      .from("hair_applications")
      .select(
        `
        id, message, offer_price, status, created_at, provider_id,
        profiles:provider_id(full_name, transport_type)
      `
      )
      .eq("request_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur chargement candidatures:", error);
    }

    if (data) setApplications(data);
  }

  useEffect(() => {
    loadApplications();
  }, [id]);

  /* ---------- Vérification des notes existantes ---------- */
  useEffect(() => {
    if (!id) return;

    async function checkRatings() {
      const { data, error } = await supabase
        .from("ratings")
        .select("*")
        .eq("request_id", id);

      if (error || !data) return;

      if (data.some((r) => r.rated_user_role === "provider"))
        setHasRatedProvider(true);

      if (data.some((r) => r.rated_user_role === "customer"))
        setHasRatedCustomer(true);
    }

    checkRatings();
  }, [id]);

  if (checkingUser && !request) {
    return (
      <p className="text-sm text-slate-500 px-4 pt-24">Chargement...</p>
    );
  }

  if (!request) {
    return (
      <p className="text-sm text-slate-500 px-4 pt-24">
        Chargement de la demande...
      </p>
    );
  }

  const isCustomerOwner = user && request.customer_id === user.id;

  const acceptedApp = applications.find(
    (a) => a.status === "accepted" || a.status === "completed"
  );

  /* ---------- Empêcher candidatures doublons (Option A) ---------- */
  async function submitApplication(e) {
    e.preventDefault();

    if (!user) {
      router.push("/auth");
      return;
    }

    setSubmitting(true);
    setFeedback("");

    // Vérifier si ce prestataire a déjà candidaté pour cette demande
    const { data: existing, error: existError } = await supabase
      .from("hair_applications")
      .select("id, status")
      .eq("request_id", id)
      .eq("provider_id", user.id);

    if (existError) {
      console.error("Erreur vérification candidature :", existError);
      setFeedback("Erreur lors de la vérification. Réessayez.");
      setSubmitting(false);
      return;
    }

    if (existing && existing.length > 0) {
      setFeedback("Vous avez déjà candidaté pour cette demande.");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("hair_applications").insert({
      request_id: id,
      provider_id: user.id,
      message: applicationMessage || null,
      offer_price: applicationPrice ? Number(applicationPrice) : null,
      status: "pending",
    });

    if (error) {
      console.error("Erreur envoi candidature:", error);
      setFeedback("Erreur lors de l’envoi.");
    } else {
      setFeedback("Candidature envoyée !");
      setApplicationMessage("");
      setApplicationPrice("");
      await loadApplications();
    }

    setSubmitting(false);
  }

  /* ---------- Accepter une candidature ---------- */
  async function acceptApplication(appId, providerId) {
    try {
      // 1) passer cette candidature à "accepted"
      const { error: e1 } = await supabase
        .from("hair_applications")
        .update({ status: "accepted" })
        .eq("id", String(appId));

      if (e1) {
        console.error("Erreur acceptation:", e1);
        alert("Erreur lors de l'acceptation de la candidature.");
        return;
      }

      // 2) passer les autres à "rejected"
      const { error: e2 } = await supabase
        .from("hair_applications")
        .update({ status: "rejected" })
        .eq("request_id", id)
        .neq("id", String(appId));

      if (e2) {
        console.error("Erreur rejet des autres candidatures:", e2);
      }

      // 3) passer la demande en "assigned"
      const { error: e3 } = await supabase
        .from("hair_requests")
        .update({ status: "assigned" })
        .eq("id", id);

      if (e3) {
        console.error("Erreur mise à jour demande (assigned):", e3);
      }

      alert("Prestataire accepté !");
      await loadApplications();

      // recharger la demande pour mettre à jour le statut
      const { data: reqData } = await supabase
        .from("hair_requests")
        .select("*")
        .eq("id", id)
        .single();
      if (reqData) setRequest(reqData);
    } catch (err) {
      console.error("Erreur inattendue acceptation:", err);
    }
  }

  /* ---------- Rejeter une candidature ---------- */
  async function rejectApplication(appId) {
    try {
      const { error } = await supabase
        .from("hair_applications")
        .update({ status: "rejected" })
        .eq("id", String(appId));

      if (error) {
        console.error("Erreur rejet:", error);
        alert("Erreur lors du rejet.");
        return;
      }

      await loadApplications();
    } catch (err) {
      console.error("Erreur inattendue rejet:", err);
    }
  }

  /* ---------- Marquer comme complétée ---------- */
  async function completeTask(providerId) {
    if (
      !confirm(
        "Confirmer que la prestation de coiffure est terminée ?"
      )
    )
      return;

    try {
      // 1) demande -> completed
      const { error: e1 } = await supabase
        .from("hair_requests")
        .update({ status: "completed" })
        .eq("id", id);

      if (e1) {
        console.error("Erreur completion hair_requests:", e1);
        alert("Erreur lors de la finalisation.");
        return;
      }

      // 2) candidature acceptée -> completed
      const { error: e2 } = await supabase
        .from("hair_applications")
        .update({ status: "completed" })
        .eq("request_id", id)
        .eq("status", "accepted");

      if (e2) {
        console.error("Erreur completion hair_applications:", e2);
      }

      // 3) RPC pour augmenter completed_tasks du prestataire
      const { error: e3 } = await supabase.rpc(
        "increase_provider_completed_tasks",
        {
          provider_id: providerId,
        }
      );

      if (e3) {
        console.error("Erreur RPC completed_tasks:", e3);
      }

      // mettre à jour l'état local & recharger
      const { data: reqData } = await supabase
        .from("hair_requests")
        .select("*")
        .eq("id", id)
        .single();
      if (reqData) setRequest(reqData);

      await loadApplications();
    } catch (err) {
      console.error("Erreur inattendue completion:", err);
    }
  }

  /* ---------- Notation client → prestataire ---------- */
  async function submitRating() {
    if (!acceptedApp || !user || !rating) return;

    const { error } = await supabase.from("ratings").insert({
      request_id: id,
      provider_id: acceptedApp.provider_id,
      customer_id: user.id,
      rating,
      review: review.trim() || null,
      rated_user_role: "provider",
    });

    if (error) {
      console.error("Erreur notation prestataire:", error);
      alert("Erreur lors de l'enregistrement de la note.");
      return;
    }

    setHasRatedProvider(true);
    setRating(0);
    setReview("");
    alert("Merci pour votre note !");
  }

  /* ---------- Notation prestataire → client ---------- */
  async function submitProviderRating() {
    if (!acceptedApp || !user || !providerRating) return;

    const { error } = await supabase.from("ratings").insert({
      request_id: id,
      customer_id: request.customer_id,
      provider_id: user.id,
      rating: providerRating,
      review: providerReview.trim() || null,
      rated_user_role: "customer",
    });

    if (error) {
      console.error("Erreur notation client:", error);
      alert("Erreur lors de l'enregistrement de la note.");
      return;
    }

    setHasRatedCustomer(true);
    setProviderRating(0);
    setProviderReview("");
    alert("Merci d’avoir évalué le client !");
  }

  /* ---------- Conditions pour le chat ---------- */
  const showChat =
    request.status === "assigned" &&
    user &&
    (request.customer_id === user.id ||
      (acceptedApp && acceptedApp.provider_id === user.id));

  const genderLabel =
    request.gender === "male"
      ? "Homme"
      : request.gender === "female"
      ? "Femme"
      : request.gender || "";

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-32 space-y-6">
      {/* CARTE DEMANDE */}
      <div className="bg-[#13151A] p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-700">
        <h2 className="text-2xl sm:text-3xl font-semibold mb-3 text-[#D4AF37]">
          Coiffure #{request.id}
        </h2>

        <div className="space-y-2 text-sm sm:text-base text-slate-200">
          <p>
            <span className="font-medium">Genre :</span> {genderLabel}
          </p>
          <p>
            <span className="font-medium">Service :</span>{" "}
            {request.service_type}
          </p>
          <p>
            <span className="font-medium">Lieu :</span> {request.location}
          </p>

          {request.preferred_time && (
            <p>
              <span className="font-medium">Heure souhaitée :</span>{" "}
              {request.preferred_time}
            </p>
          )}

          {request.description && (
            <p>
              <span className="font-medium">Détails :</span>{" "}
              {request.description}
            </p>
          )}

          {request.budget && (
            <p>
              <span className="font-medium">Budget :</span>{" "}
              {request.budget} FCFA
            </p>
          )}

          <p className="text-xs text-slate-500">
            Publiée le :{" "}
            {new Date(request.created_at).toLocaleString("fr-FR")}
          </p>

          <p className="text-xs text-slate-500">
            Statut : {statusLabels[request.status] || request.status}
          </p>
        </div>

        {/* LIEN VERS PROFIL CLIENT (pour le prestataire) */}
        {!isCustomerOwner && (
          <p
            className="text-sm text-[#D4AF37] underline cursor-pointer mt-4"
            onClick={() =>
              router.push(`/profile/customer?id=${request.customer_id}`)
            }
          >
            Voir le profil du client
          </p>
        )}
      </div>

      {/* FORMULAIRE PRESTATAIRE POUR CANDIDATER */}
      {!isCustomerOwner && request.status === "open" && (
        <div className="bg-[#13151A] p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-700">
          <h3 className="text-lg font-semibold mb-3">
            Postuler à cette prestation
          </h3>

          {!user ? (
            <button
              onClick={() => router.push("/auth")}
              className="w-full rounded-xl bg-[#D4AF37] text-black py-3 text-sm sm:text-base font-semibold hover:bg-[#be9d31]"
            >
              Se connecter
            </button>
          ) : (
            <form onSubmit={submitApplication} className="space-y-4">
              <textarea
                className="w-full border border-slate-700 rounded-xl px-3 py-3 text-sm sm:text-base bg-[#0B0C10] text-slate-200 h-24"
                placeholder="Votre message au client..."
                value={applicationMessage}
                onChange={(e) =>
                  setApplicationMessage(e.target.value)
                }
              />

              <input
                type="number"
                className="w-full border border-slate-700 rounded-xl px-3 py-3 text-sm sm:text-base bg-[#0B0C10] text-slate-200"
                placeholder="Votre prix (FCFA)"
                value={applicationPrice}
                onChange={(e) => setApplicationPrice(e.target.value)}
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-[#D4AF37] text-black py-3 text-sm sm:text-base font-semibold hover:bg-[#be9d31] disabled:opacity-50"
              >
                {submitting ? "Envoi..." : "Envoyer"}
              </button>

              {feedback && (
                <p className="text-sm text-center text-slate-300">
                  {feedback}
                </p>
              )}
            </form>
          )}
        </div>
      )}

      {/* VUE CLIENT : LISTE CANDIDATURES */}
      {isCustomerOwner && (
        <div className="bg-[#13151A] p-5 sm:p-6 rounded-2xl shadow-sm space-y-4 border border-slate-700">
          <h3 className="text-lg font-semibold">Candidatures</h3>

          {applications.length === 0 && (
            <p className="text-sm text-slate-400">
              Aucune candidature pour l'instant.
            </p>
          )}

          {applications.map((app) => (
            <div
              key={app.id}
              className="border border-slate-700 rounded-xl p-4 sm:p-5 bg-[#0B0C10] space-y-2"
            >
              <p
                className="font-semibold text-sm text-[#D4AF37] cursor-pointer"
                onClick={() =>
                  router.push(`/profile/${app.provider_id}`)
                }
              >
                {app.profiles?.full_name || "Prestataire"}
              </p>

              {app.message && (
                <p className="text-sm text-slate-300">{app.message}</p>
              )}

              {app.offer_price && (
                <p className="text-sm font-semibold text-[#D4AF37]">
                  Offre : {app.offer_price} FCFA
                </p>
              )}

              {/* PENDING */}
              {app.status === "pending" && (
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() =>
                      acceptApplication(app.id, app.provider_id)
                    }
                    className="flex-1 rounded-xl bg-[#D4AF37] text-black py-2 text-sm sm:text-base font-medium hover:bg-[#be9d31]"
                  >
                    Accepter
                  </button>

                  <button
                    onClick={() => rejectApplication(app.id)}
                    className="flex-1 rounded-xl border border-red-500 text-red-500 py-2 text-sm sm:text-base font-medium hover:bg-red-900/20"
                  >
                    Rejeter
                  </button>
                </div>
              )}

              {/* ACCEPTED */}
              {app.status === "accepted" && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                  <p className="text-sm font-semibold text-[#D4AF37]">
                    ✔ Acceptée
                  </p>

                  {request.status === "assigned" && (
                    <button
                      onClick={() => completeTask(app.provider_id)}
                      className="w-full sm:w-auto rounded-xl bg-[#D4AF37] text-black py-2 px-4 text-sm sm:text-base font-semibold hover:bg-[#be9d31]"
                    >
                      Marquer comme complétée
                    </button>
                  )}
                </div>
              )}

              {/* COMPLETED */}
              {app.status === "completed" && (
                <div>
                  <p className="text-sm font-semibold text-emerald-500">
                    ✔ Terminée
                  </p>
                  <RequestRatingDisplay requestId={request.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CLIENT → PRESTATAIRE */}
      {request.status === "completed" &&
        isCustomerOwner &&
        !hasRatedProvider &&
        acceptedApp && (
          <div className="bg-[#13151A] p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-700 mt-4">
            <h3 className="text-lg sm:text-xl font-semibold text-[#D4AF37]">
              Évaluer le prestataire
            </h3>

            <div className="flex gap-2 mt-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-2xl sm:text-3xl ${
                    rating >= star ? "text-[#D4AF37]" : "text-gray-600"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              placeholder="Votre avis (optionnel)"
              className="w-full border border-slate-700 rounded-xl px-3 py-3 text-sm sm:text-base bg-[#0B0C10] text-slate-200 mt-3 h-24"
              value={review}
              onChange={(e) => setReview(e.target.value)}
            />

            <button
              onClick={submitRating}
              className="mt-3 w-full rounded-xl bg-[#D4AF37] text-black py-3 text-sm sm:text-base font-semibold hover:bg-[#be9d31]"
            >
              Soumettre
            </button>
          </div>
        )}

      {/* PRESTATAIRE → CLIENT */}
      {request.status === "completed" &&
        acceptedApp &&
        user &&
        acceptedApp.provider_id === user.id &&
        !hasRatedCustomer && (
          <div className="bg-[#13151A] p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-700 mt-4">
            <h3 className="text-lg sm:text-xl font-semibold text-[#D4AF37]">
              Évaluer le client
            </h3>

            <div className="flex gap-2 mt-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setProviderRating(star)}
                  className={`text-2xl sm:text-3xl ${
                    providerRating >= star ? "text-[#D4AF37]" : "text-gray-600"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              placeholder="Votre avis (optionnel)"
              className="w-full border border-slate-700 rounded-xl px-3 py-3 text-sm sm:text-base bg-[#0B0C10] text-slate-200 mt-3 h-24"
              value={providerReview}
              onChange={(e) => setProviderReview(e.target.value)}
            />

            <button
              onClick={submitProviderRating}
              className="mt-3 w-full rounded-xl bg-[#D4AF37] text-black py-3 text-sm sm:text-base font-semibold hover:bg-[#be9d31]"
            >
              Soumettre
            </button>
          </div>
        )}

      {/* CHAT SECTION */}
      {showChat && (
        <div id="chat">
          <Chat requestId={request.id} user={user} />
        </div>
      )}

      {/* BLOC GLOBAL DES NOTES (après complétion) */}
      {request.status === "completed" && (
        <div className="mt-6">
          <RequestRatingDisplay requestId={request.id} />
        </div>
      )}
    </div>
  );
}
