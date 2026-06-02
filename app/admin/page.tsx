"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";
import { Order, OrderStatus } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";

export default function AdminPage() {
  const { t, lang } = useLang();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "all">("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function loadOrders() {
    const res = await fetch("/api/orders");
    const data: Order[] = await res.json();
    setOrders(data);
    setLoading(false);
  }

  useEffect(() => { loadOrders(); }, []);

  const displayed =
    tab === "pending" ? orders.filter((o) => o.status === "pending") : orders;

  async function handleApprove(id: string) {
    if (!confirm(t("admin.confirmApprove"))) return;
    setProcessing(id);
    try {
      const res = await fetch(`/api/orders/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote: notes[id] ?? "" }),
      });
      if (res.ok) {
        setMessage(t("order.status.approved") + " ✓");
        await loadOrders();
      }
    } finally {
      setProcessing(null);
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function handleReject(id: string) {
    if (!confirm(t("admin.confirmReject"))) return;
    setProcessing(id);
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessage(t("order.status.cancelled") + " ✓");
        await loadOrders();
      }
    } finally {
      setProcessing(null);
      setTimeout(() => setMessage(""), 3000);
    }
  }

  const stats = {
    pending: orders.filter((o) => o.status === "pending").length,
    approved: orders.filter((o) => o.status === "approved").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("admin.title")}</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {(["pending", "approved", "cancelled"] as OrderStatus[]).map((s) => (
          <div key={s} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats[s]}</p>
            <div className="mt-1"><StatusBadge status={s} /></div>
          </div>
        ))}
      </div>

      {/* Flash message */}
      {message && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-green-700 text-sm mb-4">
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab("pending")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "pending" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
        >
          {t("admin.pending")} {stats.pending > 0 && <span className="ml-1 bg-yellow-400 text-white text-xs px-1.5 rounded-full">{stats.pending}</span>}
        </button>
        <button
          onClick={() => setTab("all")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "all" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
        >
          {t("admin.allOrders")}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">{t("common.loading")}</div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400">{t("admin.noOrders")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map((order) => (
            <AdminOrderCard
              key={order.id}
              order={order}
              note={notes[order.id] ?? ""}
              onNoteChange={(v) => setNotes((prev) => ({ ...prev, [order.id]: v }))}
              onApprove={() => handleApprove(order.id)}
              onReject={() => handleReject(order.id)}
              processing={processing === order.id}
              lang={lang}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface AdminCardProps {
  order: Order;
  note: string;
  onNoteChange: (v: string) => void;
  onApprove: () => void;
  onReject: () => void;
  processing: boolean;
  lang: string;
}

function AdminOrderCard({ order, note, onNoteChange, onApprove, onReject, processing, lang }: AdminCardProps) {
  const { t } = useLang();
  const date = new Date(order.createdAt).toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB");

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <StatusBadge status={order.status} />
            <PriorityBadge priority={order.priority} />
          </div>
          <p className="font-semibold text-gray-900">{order.employeeName}</p>
          <p className="text-sm text-gray-500">{order.department} · {date}</p>
          <p className="text-sm text-gray-600 mt-1 italic">"{order.justification}"</p>

          {/* Items summary */}
          <div className="mt-3 space-y-1">
            {order.items.map((item, i) => (
              <p key={i} className="text-xs text-gray-500">
                • {item.name} ×{item.quantity} — {item.totalPrice.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} {t("common.pln")}
              </p>
            ))}
          </div>
          <p className="text-sm font-bold text-blue-700 mt-2">
            {t("order.totalValue")}: {order.totalValue.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} {t("common.pln")}
          </p>
          {order.adminNote && (
            <p className="text-xs text-blue-600 mt-1 italic">{t("order.detail.adminNote")}: {order.adminNote}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:w-56 flex-shrink-0">
          <Link
            href={`/orders/${order.id}`}
            className="text-xs text-center text-gray-500 hover:underline"
          >
            {t("order.list.viewDetails")} →
          </Link>
          {order.status === "pending" && (
            <>
              <textarea
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder={t("admin.notePlaceholder")}
                rows={2}
                className="border border-gray-300 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={onApprove}
                disabled={processing}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium py-2 rounded-lg transition-colors"
              >
                {processing ? t("common.loading") : t("admin.approve")}
              </button>
              <button
                onClick={onReject}
                disabled={processing}
                className="bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 text-sm font-medium py-2 rounded-lg border border-red-200 transition-colors"
              >
                {t("admin.reject")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
