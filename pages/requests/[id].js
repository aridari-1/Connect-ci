import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';

function RequestRatingDisplay({ requestId }) {
  const [ratingData, setRatingData] = useState(null);

  useEffect(() => {
    async function loadRating() {
      const { data, error } = await supabase
        .from('ratings')
        .select('rating, review, created_at, rated_user_role')
        .eq('request_id', requestId);

      if (!error && data) setRatingData(data);
    }
    loadRating();
  }, [requestId]);

  if (!ratingData || ratingData.length === 0) return null;

  return (
    <div className="mt-3 p-3 bg-[#13151A] rounded-xl border border-slate-700">
      <p className="text-sm font-semibold text-slate-200">Avis & évaluations :</p>

      {ratingData.map((r, i) => (
        <div key={i} className="mt-2">
          <p className="text-xs text-slate-500">
            {r.rated_user_role === "provider" ? "Client → Livreur" : "Livreur → Client"}
          </p>

          <p className="text-[#D4AF37] text-xl mt-1">
            {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
          </p>

          {r.review && (
            <p className="text-sm text-slate-400 mt-1 italic">
              “{r.review}”
            </p>
          )}

          <p className="text-[10px] text-slate-500 mt-1">
            {new Date(r.created_at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}

function Chat({ requestId, user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    async function loadMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id, content, sender_id, created_at,
          profiles:sender_id(full_name)
        `)
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      if (!error && data) setMessages(data);
    }

    loadMessages();

    const channel = supabase
      .channel(`messages_${requestId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `request_id=eq.${requestId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await supabase.from('messages').insert({
      request_id: requestId,
      sender_id: user.id,
      content: newMessage.trim(),
    });

    setNewMessage('');
  }

  return (
    <div className="bg-[#13151A] p-4 rounded-2xl shadow-sm mt-4 border border-slate-700" id="chat">
      <h3 className="text-lg font-semibold mb-3">Chat</h3>

      <div className="h-64 overflow-y-auto border border-slate-700 rounded-xl p-3 bg-[#13151A] space-y-3">
        {messages.map((msg) => {
          const isMine = msg.sender_id === user.id;

          return (
            <div
              key={msg.id}
              className={`max-w-[75%] p-2 rounded-xl text-sm ${
                isMine
                  ? "ml-auto bg-[#D4AF37] text-black"
                  : "mr-auto bg-[#1a1d1f] border border-slate-700 text-slate-200"
              }`}
            >
              <p>{msg.content}</p>
              <p className="text-[10px] mt-1 opacity-70">
                {new Date(msg.created_at).toLocaleTimeString()}
              </p>
            </div>
          );
        })}

        {messages.length === 0 && (
          <p className="text-xs text-slate-500 text-center">Aucun message pour le moment.</p>
        )}
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

export default function RequestDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [request, setRequest] = useState(null);
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);

  const [applicationMessage, setApplicationMessage] = useState('');
  const [applicationPrice, setApplicationPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const [checkingUser, setCheckingUser] = useState(true);

  // Customer → Provider rating states
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [hasRatedProvider, setHasRatedProvider] = useState(false);

  // Provider → Customer rating states
  const [providerRating, setProviderRating] = useState(0);
  const [providerReview, setProviderReview] = useState('');
  const [hasRatedCustomer, setHasRatedCustomer] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);
      setCheckingUser(false);
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (!id) return;

    async function loadRequest() {
      const { data, error } = await supabase
        .from('delivery_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) setRequest(data);
    }

    loadRequest();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    async function loadApplications() {
      const { data, error } = await supabase
        .from('delivery_applications')
        .select(`
          id, message, offer_price, status, created_at, provider_id,
          profiles:provider_id ( full_name, transport_type )
        `)
        .eq('request_id', id)
        .order('created_at', { ascending: false });

      if (!error && data) setApplications(data);
    }

    loadApplications();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    async function checkExistingRatings() {
      const { data } = await supabase
        .from('ratings')
        .select('*')
        .eq('request_id', id);

      if (!data) return;

      // Check if customer already rated provider
      if (data.some(r => r.rated_user_role === "provider")) {
        setHasRatedProvider(true);
      }

      // Check if provider already rated customer
      if (data.some(r => r.rated_user_role === "customer")) {
        setHasRatedCustomer(true);
      }
    }

    checkExistingRatings();
  }, [id]);

  if (checkingUser && !request) {
    return <p className="text-sm text-slate-500">Loading...</p>;
  }

  if (!request) {
    return <p className="text-sm text-slate-500">Loading request...</p>;
  }

  const isCustomerOwner = user && request.customer_id === user.id;
  const acceptedApp = applications.find(
    (a) => a.status === 'accepted' || a.status === 'completed'
  );

  async function submitApplication(e) {
    e.preventDefault();

    if (!user) {
      router.push('/auth');
      return;
    }

    setSubmitting(true);
    setFeedback('');

    const { error } = await supabase.from('delivery_applications').insert({
      request_id: id,
      provider_id: user.id,
      message: applicationMessage,
      offer_price: applicationPrice ? Number(applicationPrice) : null,
    });

    if (error) setFeedback('Erreur lors de l’envoi.');
    else {
      setFeedback('Candidature envoyée !');
      setApplicationMessage('');
      setApplicationPrice('');
    }

    setSubmitting(false);
  }

  async function acceptApplication(appId, providerId) {
    await supabase
      .from('delivery_applications')
      .update({ status: 'accepted' })
      .eq('id', appId);

    await supabase
      .from('delivery_requests')
      .update({ status: 'assigned' })
      .eq('id', id);

    alert('Livreur accepté ! Vous pouvez discuter.');
    router.reload();
  }

  async function rejectApplication(appId) {
    await supabase
      .from('delivery_applications')
      .update({ status: 'rejected' })
      .eq('id', appId);

    router.reload();
  }

  async function completeTask(providerId) {
    if (!confirm('Confirmer que la livraison est terminée ?')) return;

    const requestId = Number(id);

    await supabase
      .from('delivery_requests')
      .update({ status: 'completed' })
      .eq('id', requestId);

    await supabase
      .from('delivery_applications')
      .update({ status: 'completed' })
      .eq('request_id', requestId)
      .eq('status', 'accepted');

    await supabase.rpc("increase_provider_completed_tasks", {
      provider_id: providerId,
    });

    setRequest((prev) => ({ ...prev, status: 'completed' }));

    router.reload();
  }

  async function submitProviderRating() {
    await supabase.from('ratings').insert({
      request_id: id,
      customer_id: request.customer_id,
      provider_id: user.id,
      rating: providerRating,
      review: providerReview.trim() || null,
      rated_user_role: "customer",
    });

    setHasRatedCustomer(true);
    setProviderRating(0);
    setProviderReview('');
    alert("Merci d’avoir évalué le client !");
    router.reload();
  }

  async function submitRating() {
    await supabase.from('ratings').insert({
      request_id: id,
      provider_id: acceptedApp.provider_id,
      customer_id: user.id,
      rating,
      review: review.trim() || null,
      rated_user_role: "provider",
    });

    setHasRatedProvider(true);
    setRating(0);
    setReview('');
    alert("Merci pour votre note !");
    router.reload();
  }

  const showChat =
    request.status === 'assigned' &&
    user &&
    (request.customer_id === user.id ||
      (acceptedApp && acceptedApp.provider_id === user.id));

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* REQUEST CARD */}
      <div className="bg-[#13151A] p-6 rounded-2xl shadow-sm border border-slate-700">
        <h2 className="text-2xl font-semibold mb-4 text-[#D4AF37]">
          Livraison #{request.id}
        </h2>

        <div className="space-y-2 text-sm text-slate-200">
          <p><span className="font-medium">Pickup:</span> {request.pickup_location}</p>
          <p><span className="font-medium">Drop-off:</span> {request.dropoff_location}</p>
          <p><span className="font-medium">Item:</span> {request.item_description}</p>

          {request.budget && (
            <p><span className="font-medium">Budget:</span> {request.budget} FCFA</p>
          )}

          <p className="text-xs text-slate-500">
            Posted: {new Date(request.created_at).toLocaleString()}
          </p>

          <p className="text-xs text-slate-500">Status: {request.status}</p>
        </div>
      </div>

      {/* PROVIDER APPLICATION FORM */}
      {!isCustomerOwner && request.status === "open" && (
        <div className="bg-[#13151A] p-6 rounded-2xl shadow-sm border border-slate-700">
          <h3 className="text-lg font-semibold mb-3">Postuler à cette livraison</h3>

          {!user ? (
            <button
              onClick={() => router.push("/auth")}
              className="w-full rounded-xl bg-[#D4AF37] text-black py-2 text-sm font-semibold hover:bg-[#be9d31]"
            >
              Se connecter
            </button>
          ) : (
            <form onSubmit={submitApplication} className="space-y-4">

              <textarea
                className="w-full border border-slate-700 rounded-xl px-3 py-2 text-sm bg-[#0B0C10] text-slate-200"
                placeholder="Votre message au client..."
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
              />

              <input
                type="number"
                className="w-full border border-slate-700 rounded-xl px-3 py-2 text-sm bg-[#0B0C10] text-slate-200"
                placeholder="Votre prix (FCFA)"
                value={applicationPrice}
                onChange={(e) => setApplicationPrice(e.target.value)}
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-[#D4AF37] text-black py-2 text-sm font-semibold hover:bg-[#be9d31]"
              >
                {submitting ? "Envoi..." : "Envoyer"}
              </button>

              {feedback && (
                <p className="text-sm text-center text-slate-300">{feedback}</p>
              )}

            </form>
          )}
        </div>
      )}

      {/* CUSTOMER VIEW: APPLICATION LIST */}
      {isCustomerOwner && (
        <div className="bg-[#13151A] p-6 rounded-2xl shadow-sm space-y-4 border border-slate-700">
          <h3 className="text-lg font-semibold">Candidatures</h3>

          {applications.length === 0 && (
            <p className="text-sm text-slate-400">Aucune candidature pour l'instant.</p>
          )}

          {applications.map((app) => (
            <div
              key={app.id}
              className="border border-slate-700 rounded-xl p-4 space-y-2 bg-[#0B0C10]"
            >
              <p className="font-medium text-[#D4AF37] cursor-pointer"
                 onClick={() => router.push(`/profile/${app.provider_id}`)}>
                {app.profiles?.full_name}
              </p>

              <p className="text-sm text-slate-300">{app.message}</p>

              {app.offer_price && (
                <p className="text-sm font-semibold text-[#D4AF37]">
                  Offre : {app.offer_price} FCFA
                </p>
              )}

              {app.status === "pending" && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => acceptApplication(app.id, app.provider_id)}
                    className="flex-1 rounded-xl bg-[#D4AF37] text-black py-2 text-sm font-medium hover:bg-[#be9d31]"
                  >
                    Accepter
                  </button>

                  <button
                    onClick={() => rejectApplication(app.id)}
                    className="flex-1 rounded-xl border border-red-500 text-red-500 py-2 text-sm font-medium hover:bg-red-900/20"
                  >
                    Rejeter
                  </button>
                </div>
              )}

              {app.status === "accepted" && (
                <div className="flex justify-between items-center">
                  <p className="text-sm font-semibold text-[#D4AF37]">✔ Acceptée</p>
                  {request.status === "assigned" && (
                    <button
                      onClick={() => completeTask(app.provider_id)}
                      className="mt-3 w-full rounded-xl bg-[#D4AF37] text-black py-2 text-sm font-semibold hover:bg-[#be9d31]"
                    >
                      Marquer comme complétée
                    </button>
                  )}
                </div>
              )}

              {app.status === "completed" && (
                <div>
                  <p className="text-sm font-semibold text-emerald-500">✔ Terminée</p>
                  <RequestRatingDisplay requestId={request.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CUSTOMER RATES PROVIDER */}
      {request.status === "completed" &&
        isCustomerOwner &&
        !hasRatedProvider && acceptedApp && (
          <div
            id="rating"
            className="bg-[#13151A] p-5 rounded-xl shadow-sm mt-5 border border-slate-700"
          >
            <h3 className="text-lg font-semibold text-[#D4AF37]">Évaluer le livreur</h3>

            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-2xl ${
                    rating >= star ? "text-[#D4AF37]" : "text-gray-600"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              placeholder="Votre avis (optionnel)"
              className="w-full border border-slate-700 rounded-xl px-3 py-2 text-sm bg-[#0B0C10] text-slate-200 mt-3"
              value={review}
              onChange={(e) => setReview(e.target.value)}
            />

            <button
              onClick={submitRating}
              className="mt-3 w-full bg-[#D4AF37] text-black py-2 rounded-xl text-sm font-semibold hover:bg-[#be9d31]"
            >
              Soumettre
            </button>
          </div>
        )}

      {/* PROVIDER RATES CUSTOMER */}
      {request.status === "completed" &&
        acceptedApp &&
        user &&
        acceptedApp.provider_id === user.id &&
        !hasRatedCustomer && (
          <div
            id="rating"
            className="bg-[#13151A] p-5 rounded-xl shadow-sm mt-5 border border-slate-700"
          >
            <h3 className="text-lg font-semibold text-[#D4AF37]">Évaluer le client</h3>

            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setProviderRating(star)}
                  className={`text-2xl ${
                    providerRating >= star ? "text-[#D4AF37]" : "text-gray-600"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              placeholder="Votre avis (optionnel)"
              className="w-full border border-slate-700 rounded-xl px-3 py-2 text-sm bg-[#0B0C10] text-slate-200 mt-3"
              value={providerReview}
              onChange={(e) => setProviderReview(e.target.value)}
            />

            <button
              onClick={submitProviderRating}
              className="mt-3 w-full bg-[#D4AF37] text-black py-2 rounded-xl text-sm font-semibold hover:bg-[#be9d31]"
            >
              Soumettre
            </button>
          </div>
        )}

      {/* CHAT */}
      {showChat && <Chat requestId={request.id} user={user} />}

      {/* DISPLAY ALL RATINGS */}
      {request.status === "completed" && (
        <RequestRatingDisplay requestId={request.id} />
      )}

    </div>
  );
}
