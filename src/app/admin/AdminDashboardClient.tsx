"use client";

import { useState } from "react";
import {
  BarChart3,
  Car as CarIcon,
  CalendarCheck,
  Star,
  MessageSquare,
  TrendingUp,
  Users,
  Wallet,
  PlusCircle,
  LayoutDashboard
} from "lucide-react";
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
  { id: "bookings", label: "Bookings", icon: CalendarCheck },
  { id: "fleet", label: "Fleet", icon: CarIcon },
  { id: "leases", label: "Leases", icon: Users },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "messages", label: "Messages", icon: MessageSquare },
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
    setCars((prev) => [...prev, newCar as Car]);
  };

  return (
    <div className="min-h-screen bg-slate-50/30">
      {showAddCar && (
        <AddCarModal
          onClose={() => setShowAddCar(false)}
          onAdded={handleCarAdded}
        />
      )}

      {/* Hero Stats Section */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-onyx-950 flex items-center justify-center shadow-lg">
            <LayoutDashboard className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-onyx-950 tracking-tight">Nova Intelligence</h1>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Management Console</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <StatCard
            label="Total Bookings"
            value={bookings.length}
            icon={CalendarCheck}
            trend="+12%"
          />
          <StatCard
            label="Settled"
            value={paidCount}
            icon={TrendingUp}
            variant="gold"
          />
          <StatCard
            label="Active Fleet"
            value={cars.length}
            icon={CarIcon}
          />
          <StatCard
            label="Revenue"
            value={`KSh ${revenue.toLocaleString('en-US')}`}
            icon={Wallet}
            variant="gold"
          />
          <StatCard
            label="Lease Enquiries"
            value={pendingLeases}
            icon={Users}
          />
          <StatCard
            label="Client Trust"
            value={reviews.length}
            icon={Star}
            variant="gold"
          />
        </div>
      </div>

      {/* Navigation & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div className="flex flex-wrap gap-2 rounded-[2rem] bg-white p-2 shadow-xl shadow-slate-200/50 border border-slate-100">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 rounded-[1.5rem] px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab.id
                ? "bg-onyx-950 text-brand-600 shadow-lg shadow-black/20"
                : "text-slate-500 hover:bg-slate-50 hover:text-onyx-950"
                }`}
            >
              <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? "text-brand-600" : "text-slate-300"}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "fleet" && (
          <button
            onClick={() => setShowAddCar(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-2xl hover:bg-brand-700 transition-all hover:-translate-y-1"
          >
            <PlusCircle className="h-4 w-4" /> Register New Vehicle
          </button>
        )}
      </div>

      {/* Dynamic Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
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
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  variant = "default",
}: {
  label: string;
  value: string | number;
  icon: any;
  trend?: string;
  variant?: "default" | "gold";
}) {
  return (
    <div className={`group relative overflow-hidden rounded-[2.5rem] bg-white p-8 border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:border-brand-600/20`}>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${variant === "gold" ? "bg-brand-50 text-brand-600" : "bg-slate-50 text-slate-400 group-hover:bg-onyx-950 group-hover:text-brand-600"
            }`}>
            <Icon className="h-6 w-6" />
          </div>
          {trend && (
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-widest">
              {trend}
            </span>
          )}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1.5">{label}</p>
        <p className={`text-2xl font-display font-bold ${variant === "gold" ? "text-brand-600" : "text-onyx-950"}`}>
          {value}
        </p>
      </div>

      {/* Subtle background decoration */}
      <div className="absolute -right-4 -bottom-4 opacity-[0.03] rotate-12 transition-transform group-hover:scale-125 group-hover:rotate-0 duration-700">
        <Icon className="h-32 w-32" />
      </div>
    </div>
  );
}
