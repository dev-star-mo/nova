"use client";

import { useState } from "react";
import type { Car, BookingWithCar, LeaseRequest, Review } from "@/types/database";
import { BookingsTab } from "@/components/admin/BookingsTab";
import { FleetTab } from "@/components/admin/FleetTab";
import { MessagesTab } from "@/components/admin/MessagesTab";
import { LeaseRequestsTab } from "@/components/admin/LeaseRequestsTab";
import { ReviewsTab } from "@/components/admin/ReviewsTab";
import { AddCarModal } from "@/components/admin/AddCarModal";

type Props = {
  bookings: BookingWithCar[];
  cars: Car[];
  leaseRequests: LeaseRequest[];
  reviews: Review[];
};

const TABS = [
  { id: "bookings", label: "📋 Bookings" },
  { id: "fleet", label: "🚗 Fleet" },
  { id: "leases", label: "🏠 Leases" },
  { id: "reviews", label: "★ Reviews" },
  { id: "messages", label: "💬 Messages" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminDashboardClient({ bookings, cars: initialCars, leaseRequests: initialLeaseRequests, reviews: initialReviews }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("bookings");
  const [cars, setCars] = useState<Car[]>(initialCars);
  const [leaseRequests] = useState<LeaseRequest[]>(initialLeaseRequests);
  const [reviews] = useState<Review[]>(initialReviews);
  const [showAddCar, setShowAddCar] = useState(false);

  const paidCount = bookings.filter((b) => b.status === "paid").length;
  const revenue = bookings
    .filter((b) => b.status === "paid")
    .reduce((sum, b) => sum + Number(b.total_amount), 0);

  const pendingLeases = leaseRequests.filter(r => r.status === "new").length;

  const handleCarAdded = (newCar: Record<string, unknown>) => {
    // Optimistically add to list until page refreshes
    setCars((prev) => [...prev, newCar as Car]);
  };

  return (
    <>
      {showAddCar && (
        <AddCarModal
          onClose={() => setShowAddCar(false)}
          onAdded={handleCarAdded}
        />
      )}

      {/* Stats row */}
      <div className="mb-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total bookings" value={bookings.length} />
        <StatCard label="Paid bookings" value={paidCount} accent />
        <StatCard label="Total fleet" value={cars.length} />
        <StatCard
          label="Revenue"
          value={`KSh ${revenue.toLocaleString('en-US')}`}
          accent
        />
        <StatCard label="Pending leases" value={pendingLeases} accent />
        <StatCard label="Total reviews" value={reviews.length} accent />
      </div>

      {/* Tab nav */}
      <div className="mb-6 flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "bookings" && <BookingsTab bookings={bookings} />}
      {activeTab === "fleet" && (
        <FleetTab
          initialCars={cars}
          onAddCar={() => setShowAddCar(true)}
        />
      )}
      {activeTab === "leases" && (
        <LeaseRequestsTab initialRequests={leaseRequests} />
      )}
      {activeTab === "reviews" && (
        <ReviewsTab initialReviews={reviews} />
      )}
      {activeTab === "messages" && <MessagesTab bookings={bookings} />}
    </>
  );
}

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${accent ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-white"}`}>
      <p className={`text-xs font-medium uppercase tracking-wide ${accent ? "text-indigo-500" : "text-slate-500"}`}>
        {label}
      </p>
      <p className={`mt-1.5 text-2xl font-bold ${accent ? "text-indigo-700" : "text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}
