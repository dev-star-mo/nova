"use client";

import { useEffect, useState } from "react";
import { Star, MessageSquare, Quote, User as UserIcon, CheckCircle2, ChevronRight } from "lucide-react";
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
      setCanReview(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return (
    <div className="mt-20 space-y-6">
      <div className="h-8 w-48 bg-slate-50 rounded-full animate-pulse mx-auto" />
      <div className="grid gap-6 sm:grid-cols-2">
        {[1, 2].map(i => <div key={i} className="h-40 bg-slate-50 rounded-[2rem] animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <div className="mt-24 pt-20 border-t border-slate-100">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 text-brand-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
          <MessageSquare className="h-3 w-3" /> Testimonials
        </div>
        <h2 className="font-display text-4xl font-bold text-onyx-950">Client <span className="text-brand-600">Reflections</span></h2>
        <p className="mt-4 text-slate-500 font-medium max-w-xl mx-auto">First-hand accounts of the Nova experience from our esteemed collective.</p>
      </div>

      {canReview && (
        <div className="mb-20 max-w-3xl mx-auto">
          <div className="rounded-[3rem] bg-onyx-950 p-10 md:p-14 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 h-40 w-40 bg-brand-600/10 rounded-bl-[100%] pointer-events-none" />

            <div className="relative">
              <h3 className="font-display text-2xl font-bold uppercase tracking-[0.1em] mb-2">Share Your Brief</h3>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-10">Document your journey for the community.</p>

              <div className="space-y-10">
                <div className="space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Asset Rating</span>
                  <div className="flex gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`transition-all hover:scale-110 ${rating >= star ? "text-brand-600 drop-shadow-[0_0_8px_rgba(197,160,89,0.3)]" : "text-white/10"}`}
                      >
                        <Star className={`h-8 w-8 ${rating >= star ? "fill-current" : ""}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Observations</span>
                  <textarea
                    className="w-full rounded-[2rem] bg-white/5 border border-white/10 p-8 text-sm font-medium focus:outline-none focus:border-brand-600 focus:bg-white/10 transition-all min-h-[120px] placeholder:text-slate-600"
                    placeholder="Detail your deployment experience..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>

                {error && <p className="text-xs text-red-500 font-bold uppercase tracking-widest leading-relaxed">{error}</p>}

                <button
                  onClick={() => void submitReview()}
                  disabled={busy || !comment.trim()}
                  className="w-full sm:w-auto px-12 py-5 rounded-2xl bg-brand-600 text-[10px] font-bold uppercase tracking-[0.3em] text-white hover:bg-brand-700 transition-all disabled:opacity-50 group flex items-center justify-center gap-3"
                >
                  {busy ? "Securing Entry..." : (
                    <>
                      Submit Reflection
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-8 sm:grid-cols-2">
        {reviews.length === 0 ? (
          <div className="col-span-2 text-center py-20 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
            <Quote className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">The archive is currently empty</p>
          </div>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="group relative rounded-[3rem] border border-slate-50 bg-white p-10 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-2">
              <div className="absolute top-10 right-10 text-brand-600/10 pointer-events-none">
                <Quote className="h-12 w-12 rotate-180" />
              </div>

              <div className="flex items-center gap-4 mb-8">
                <div className="h-12 w-12 rounded-2xl bg-onyx-950 flex items-center justify-center text-brand-600 shadow-xl shadow-onyx-950/10 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-onyx-950 uppercase tracking-widest">{r.user_name}</h4>
                  <div className="flex gap-1 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < r.rating ? "text-brand-600 fill-current" : "text-slate-100"}`} />
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-slate-500 font-medium leading-relaxed italic mb-8">&quot;{r.comment}&quot;</p>

              <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Verified Journey</span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  {new Date(r.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
