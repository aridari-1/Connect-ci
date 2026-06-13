import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function RequestRatingDisplay({ requestId }) {
  const [ratingData, setRatingData] = useState(null);

  useEffect(() => {
    async function loadRating() {
      const { data, error } = await supabase
        .from("ratings")
        .select("rating, review, created_at")
        .eq("request_id", requestId)
        .single();

      if (!error && data) {
        setRatingData(data);
      }
    }

    loadRating();
  }, [requestId]);

  if (!ratingData) return null;

  return (
    <div className="mt-3 p-3 bg-slate-50 rounded-xl">
      <p className="text-sm font-semibold text-slate-700">
        Customer Rating:
      </p>

      {/* Stars */}
      <p className="text-yellow-500 text-xl mt-1">
        {"★".repeat(ratingData.rating)}
        {"☆".repeat(5 - ratingData.rating)}
      </p>

      {/* Review */}
      {ratingData.review && (
        <p className="text-sm text-slate-600 mt-2 italic">
          “{ratingData.review}”
        </p>
      )}

      <p className="text-xs text-slate-500 mt-1">
        {new Date(ratingData.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}
