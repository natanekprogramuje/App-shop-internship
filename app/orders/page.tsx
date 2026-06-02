"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";
import { Order, OrderStatus, Priority } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";

export default function OrdersPage() {
  const { t } = useLang();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => setOrders(data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (priorityFilter !== "all" && o.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("order.list.title")}</h1>
        <Link
          href="/orders/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + {t("nav.newOrder")}
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">{t("order.list.filterStatus")}:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "all")}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t("order.list.all")}</option>
            <option value="pending">{t("order.status.pending")}</option>
            <option value="approved">{t("order.status.approved")}</option>
            <option value="cancelled">{t("order.status.cancelled")}</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">{t("order.list.filterPriority")}:</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as Priority | "all")}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t("order.list.all")}</option>
            <option value="low">{t("order.priority.low")}</option>
            <option value="medium">{t("order.priority.medium")}</option>
            <option value="high">{t("order.priority.high")}</option>
          </select>
        </div>
        <span className="text-sm text-gray-400 self-center">({filtered.length})</span>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">{t("common.loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400 text-lg mb-4">{t("order.list.empty")}</p>
          <Link href="/orders/new" className="text-blue-600 hover:underline text-sm">
            + {t("nav.newOrder")}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderRow({ order }: { order: Order }) {
  const { t, lang } = useLang();
  const date = new Date(order.createdAt).toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB");

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <StatusBadge status={order.status} />
            <PriorityBadge priority={order.priority} />
            <span className="text-xs text-gray-400 font-mono">{order.id.slice(0, 8)}…</span>
          </div>
          <p className="font-semibold text-gray-900 truncate">{order.employeeName}</p>
          <p className="text-sm text-gray-500">{order.department} · {date}</p>
          <p className="text-xs text-gray-400 mt-1 line-clamp-1">{order.justification}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">{t("order.totalValue")}</p>
            <p className="font-bold text-blue-700 text-lg">
              {order.totalValue.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} {t("common.pln")}
            </p>
            <p className="text-xs text-gray-400">{order.items.length} {order.items.length === 1 ? "poz." : "poz."}</p>
          </div>
          <Link
            href={`/orders/${order.id}`}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            {t("order.list.viewDetails")}
          </Link>
        </div>
      </div>
    </div>
  );
}
