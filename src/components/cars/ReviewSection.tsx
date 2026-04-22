"use client";

import { useEffect, useState } from "react";
import type { Review, Booking } from "@/types/database";
import { useUserSession } from "@/components/providers/user-session-provider";
import { createClient } from "@/lib/supabase/client";

type Props = { carId: string };

export function ReviewSection({ carId }: Props) {
  const { user, profile } = useUserSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("car_id", carId)
        .order("created_at", { ascending: false });
      if (data) setReviews(data as Review[]);
      
      if (user) {
        // Check if user has a paid and finished booking
        const { data: bookings } = await supabase
          .from("bookings")
          .select("*")
          .eq("user_id", user.id)
          .eq("car_id", carId)
          .eq("status", "paid");
        
        const finished = (bookings as Booking[] ?? []).some(b => new Date(b.return_at) < new Date());
        setCanReview(finished);
      }
      setLoading(false);
    };
    void fetchReviews();
  }, [carId, user, supabase]);

  const submitReview = async () => {
    if (!comment.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.from("reviews").insert({
        user_id: user?.id,
        car_id: carId,
        rating,
        comment,
        user_name: profile?.full_name || user?.email || "Anonymous",
      }).select().single();
      
      if (err) throw err;
      setReviews([data as Review, ...reviews]);
      setComment("");
      setCanReview(false); // Only one review per finished booking (simplified)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="mt-10 h-20 animate-pulse bg-slate-50 rounded-xl" />;

  return (
    <div className="mt-16 border-t border-slate-200 pt-10">
      <h2 className="font-display text-2xl font-bold text-ink text-center">Customer Reviews</h2>
      
      {canReview && (
        <div className="mt-8 rounded-2xl border border-brand-100 bg-brand-50/50 p-6">
          <h3 className="font-bold text-ink">Write a review</h3>
          <p className="text-sm text-slate-600">Share your experience with this vehicle.</p>
          <div className="mt-4 flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-2xl ${rating >= star ? "text-amber-400" : "text-slate-300"}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            className="mt-4 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            rows={3}
            placeholder="Tell us what you liked or how we can improve..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          <button
            onClick={() => void submitReview()}
            disabled={busy || !comment.trim()}
            className="mt-4 rounded-xl bg-brand-600 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? "Submitting..." : "Submit review"}
          </button>
        </div>
      )}

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {reviews.length === 0 ? (
          <p className="col-span-2 text-center text-slate-500 py-10">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-ink">{r.user_name}</span>
                <div className="flex text-amber-400 text-xs">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>{i < r.rating ? "★" : "☆"}</span>
                  ))}
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-600 italic">&quot;{r.comment}&quot;</p>
              <p className="mt-2 text-[10px] text-slate-400">
                {new Date(r.created_at).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
