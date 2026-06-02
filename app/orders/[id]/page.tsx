"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";
import { catalog, getCatalogById } from "@/lib/catalog";
import { Order, OrderItem, Priority } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";

const DEPARTMENTS = [
  "IT", "HR", "Finance", "Marketing", "Sales",
  "Operations", "Legal", "R&D", "Customer Support",
];

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { t, lang } = useLang();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [apiError, setApiError] = useState("");

  // Edit form state
  const [employeeName, setEmployeeName] = useState("");
  const [department, setDepartment] = useState("");
  const [justification, setJustification] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((data: Order) => {
        setOrder(data);
        setEmployeeName(data.employeeName);
        setDepartment(data.department);
        setJustification(data.justification);
        setPriority(data.priority);
        setItems(data.items);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const totalValue = items.reduce((s, i) => s + i.totalPrice, 0);
  const overLimit = priority !== "high" && totalValue > 5000;

  function addItem() {
    setItems((prev) => [
      ...prev,
      { catalogItemId: "", name: "", quantity: 1, unitPrice: 0, totalPrice: 0 },
    ]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof OrderItem, value: string | number) {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[idx], [field]: value };
      if (field === "quantity" || field === "unitPrice") {
        item.totalPrice = Number(item.quantity) * Number(item.unitPrice);
      }
      if (field === "catalogItemId") {
        const ci = getCatalogById(value as string);
        if (ci) {
          item.name = lang === "pl" ? ci.name : ci.nameEn;
          item.unitPrice = ci.estimatedPrice;
          item.totalPrice = item.quantity * ci.estimatedPrice;
        }
      }
      next[idx] = item;
      return next;
    });
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!employeeName.trim()) e.employeeName = t("validation.required");
    if (!department) e.department = t("validation.required");
    if (!justification.trim()) e.justification = t("validation.required");
    if (items.length === 0) e.items = t("validation.minItems");
    items.forEach((item, i) => {
      if (item.quantity < 1 || item.quantity > 20) e[`qty_${i}`] = t("validation.qty");
      if (item.unitPrice <= 0) e[`price_${i}`] = t("validation.unitPrice");
      if (!item.name.trim()) e[`name_${i}`] = t("validation.required");
    });
    if (priority !== "high" && totalValue > 5000) e.total = t("validation.maxValue");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    setApiError("");
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeName, department, justification, priority, items }),
      });
      if (!res.ok) {
        const data = await res.json();
        setApiError(data.error ?? "Error");
        return;
      }
      const updated: Order = await res.json();
      setOrder(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel() {
    if (!confirm(t("order.cancelConfirm"))) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setApiError(data.error ?? "Error");
        return;
      }
      const updated: Order = await res.json();
      setOrder(updated);
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-400">{t("common.loading")}</div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">{t("common.noData")}</p>
        <Link href="/orders" className="text-blue-600 hover:underline">{t("order.back")}</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/orders" className="text-gray-400 hover:text-gray-600 text-sm">{t("order.back")}</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">{t("order.detail.title")}</h1>
      </div>

      {/* Status header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge status={order.status} />
          <PriorityBadge priority={editing ? priority : order.priority} />
          <span className="text-xs text-gray-400 font-mono">{order.id}</span>
        </div>
        <div className="flex gap-2">
          {order.status === "pending" && !editing && (
            <>
              <button
                onClick={() => setEditing(true)}
                className="text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium px-4 py-1.5 rounded-lg transition-colors"
              >
                {t("order.edit")}
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="text-sm bg-red-50 text-red-600 hover:bg-red-100 font-medium px-4 py-1.5 rounded-lg transition-colors"
              >
                {t("order.cancel")}
              </button>
            </>
          )}
          {editing && (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-1.5 rounded-lg transition-colors"
              >
                {saving ? t("common.loading") : t("order.save")}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEmployeeName(order.employeeName);
                  setDepartment(order.department);
                  setJustification(order.justification);
                  setPriority(order.priority);
                  setItems(order.items);
                  setErrors({});
                }}
                className="text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium px-4 py-1.5 rounded-lg transition-colors"
              >
                {t("order.back")}
              </button>
            </>
          )}
        </div>
      </div>

      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm mb-4">
          {apiError}
        </div>
      )}

      {/* Info section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4 space-y-4">
        <h2 className="font-semibold text-gray-900">{t("order.detail.info")}</h2>
        {editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t("order.employeeName")}</label>
              <input
                type="text"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.employeeName ? "border-red-400" : "border-gray-300"}`}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t("order.department")}</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.department ? "border-red-400" : "border-gray-300"}`}
              >
                <option value="">--</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">{t("order.justification")}</label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={3}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${errors.justification ? "border-red-400" : "border-gray-300"}`}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">{t("order.priority")}</label>
              <div className="flex gap-4">
                {(["low", "medium", "high"] as Priority[]).map((p) => (
                  <label key={p} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="edit-priority"
                      value={p}
                      checked={priority === p}
                      onChange={() => setPriority(p)}
                      className="accent-blue-600"
                    />
                    <span className={`text-sm font-medium ${p === "high" ? "text-red-600" : p === "medium" ? "text-blue-600" : "text-gray-600"}`}>
                      {t(`order.priority.${p}` as any)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500 text-xs">{t("order.employeeName")}</dt>
              <dd className="font-medium text-gray-900 mt-0.5">{order.employeeName}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-xs">{t("order.department")}</dt>
              <dd className="font-medium text-gray-900 mt-0.5">{order.department}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-gray-500 text-xs">{t("order.justification")}</dt>
              <dd className="font-medium text-gray-900 mt-0.5">{order.justification}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-xs">{t("common.createdAt")}</dt>
              <dd className="font-medium text-gray-900 mt-0.5">
                {new Date(order.createdAt).toLocaleString(lang === "pl" ? "pl-PL" : "en-GB")}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 text-xs">{t("common.updatedAt")}</dt>
              <dd className="font-medium text-gray-900 mt-0.5">
                {new Date(order.updatedAt).toLocaleString(lang === "pl" ? "pl-PL" : "en-GB")}
              </dd>
            </div>
          </dl>
        )}
      </div>

      {/* Items section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{t("order.detail.items")}</h2>
          {editing && (
            <button
              type="button"
              onClick={addItem}
              className="text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              + {t("order.items.add")}
            </button>
          )}
        </div>

        {errors.items && <p className="text-red-500 text-sm">{errors.items}</p>}

        {editing ? (
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">#{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t("order.items.remove")}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <select
                      value={item.catalogItemId}
                      onChange={(e) => updateItem(idx, "catalogItemId", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t("order.items.select")}</option>
                      {catalog.map((ci) => (
                        <option key={ci.id} value={ci.id}>
                          {lang === "pl" ? ci.name : ci.nameEn} — {ci.estimatedPrice.toLocaleString("pl-PL")} {t("common.pln")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{t("order.items.name")}</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(idx, "name", e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[`name_${idx}`] ? "border-red-400" : "border-gray-300"}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{t("order.items.qty")} (1–20)</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[`qty_${idx}`] ? "border-red-400" : "border-gray-300"}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{t("order.items.unitPrice")}</label>
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={item.unitPrice}
                      onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[`price_${idx}`] ? "border-red-400" : "border-gray-300"}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{t("order.items.total")}</label>
                    <div className="border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm font-medium mt-1">
                      {item.totalPrice.toLocaleString("pl-PL", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {/* Total */}
            {items.length > 0 && (
              <div className={`flex items-center justify-between p-4 rounded-lg border ${overLimit ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}>
                <div>
                  <span className="font-semibold">{t("order.totalValue")}</span>
                  {overLimit && <p className="text-xs text-red-600 mt-0.5">{t("validation.maxValueWarning")}</p>}
                </div>
                <span className={`text-xl font-bold ${overLimit ? "text-red-600" : "text-blue-700"}`}>
                  {totalValue.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} {t("common.pln")}
                </span>
              </div>
            )}
            {errors.total && <p className="text-red-500 text-sm">{errors.total}</p>}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                    <th className="pb-2 font-medium">{t("order.items.name")}</th>
                    <th className="pb-2 font-medium text-right">{t("order.items.qty")}</th>
                    <th className="pb-2 font-medium text-right">{t("order.items.unitPrice")}</th>
                    <th className="pb-2 font-medium text-right">{t("order.items.total")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {order.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 text-gray-900">{item.name}</td>
                      <td className="py-2 text-right text-gray-600">{item.quantity}</td>
                      <td className="py-2 text-right text-gray-600">
                        {item.unitPrice.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} {t("common.pln")}
                      </td>
                      <td className="py-2 text-right font-medium text-gray-900">
                        {item.totalPrice.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} {t("common.pln")}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200">
                    <td colSpan={3} className="pt-3 text-right font-semibold text-gray-700">{t("order.totalValue")}</td>
                    <td className="pt-3 text-right font-bold text-blue-700 text-lg">
                      {order.totalValue.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} {t("common.pln")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Admin note */}
      {order.adminNote && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-blue-800 mb-1">{t("order.detail.adminNote")}</h3>
          <p className="text-sm text-blue-700">{order.adminNote}</p>
        </div>
      )}
    </div>
  );
}
