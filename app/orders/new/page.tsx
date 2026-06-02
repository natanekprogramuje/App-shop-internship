"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";
import { catalog, getCatalogById } from "@/lib/catalog";
import { OrderItem, Priority } from "@/lib/types";

const MAX_VALUE = 5000;
const DEPARTMENTS = [
  "IT", "HR", "Finance", "Marketing", "Sales",
  "Operations", "Legal", "R&D", "Customer Support",
];

function NewOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, lang } = useLang();

  const [employeeName, setEmployeeName] = useState("");
  const [department, setDepartment] = useState("");
  const [justification, setJustification] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  // Pre-populate item if coming from catalog
  useEffect(() => {
    const preItemId = searchParams.get("item");
    if (preItemId) {
      const ci = getCatalogById(preItemId);
      if (ci) {
        setItems([
          {
            catalogItemId: ci.id,
            name: lang === "pl" ? ci.name : ci.nameEn,
            quantity: 1,
            unitPrice: ci.estimatedPrice,
            totalPrice: ci.estimatedPrice,
          },
        ]);
      }
    }
  }, [searchParams, lang]);

  const totalValue = items.reduce((s, i) => s + i.totalPrice, 0);
  const overLimit = priority !== "high" && totalValue > MAX_VALUE;

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
    if (priority !== "high" && totalValue > MAX_VALUE) e.total = t("validation.maxValue");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setApiError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeName, department, justification, priority, items }),
      });
      if (!res.ok) {
        const data = await res.json();
        setApiError(data.error ?? "Error");
        return;
      }
      const order = await res.json();
      router.push(`/orders/${order.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">{t("order.back")}</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">{t("order.new.title")}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Employee Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 text-lg">{t("order.detail.info")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("order.employeeName")}</label>
              <input
                type="text"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.employeeName ? "border-red-400" : "border-gray-300"}`}
              />
              {errors.employeeName && <p className="text-red-500 text-xs mt-1">{errors.employeeName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("order.department")}</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.department ? "border-red-400" : "border-gray-300"}`}
              >
                <option value="">--</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("order.justification")}</label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={3}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${errors.justification ? "border-red-400" : "border-gray-300"}`}
            />
            {errors.justification && <p className="text-red-500 text-xs mt-1">{errors.justification}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("order.priority")}</label>
            <div className="flex gap-3">
              {(["low", "medium", "high"] as Priority[]).map((p) => (
                <label key={p} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
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

        {/* Items */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-lg">{t("order.items")}</h2>
            <button
              type="button"
              onClick={addItem}
              className="text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              + {t("order.items.add")}
            </button>
          </div>

          {errors.items && <p className="text-red-500 text-sm">{errors.items}</p>}

          {items.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-4">{t("common.noData")}</p>
          )}

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">#{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    {t("order.items.remove")}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">{t("order.items.select")}</label>
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
                    <label className="block text-xs text-gray-500 mb-1">{t("order.items.name")}</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(idx, "name", e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[`name_${idx}`] ? "border-red-400" : "border-gray-300"}`}
                    />
                    {errors[`name_${idx}`] && <p className="text-red-500 text-xs mt-1">{errors[`name_${idx}`]}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t("order.items.qty")} (1–20)</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[`qty_${idx}`] ? "border-red-400" : "border-gray-300"}`}
                    />
                    {errors[`qty_${idx}`] && <p className="text-red-500 text-xs mt-1">{errors[`qty_${idx}`]}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t("order.items.unitPrice")} ({t("common.pln")})</label>
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={item.unitPrice}
                      onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[`price_${idx}`] ? "border-red-400" : "border-gray-300"}`}
                    />
                    {errors[`price_${idx}`] && <p className="text-red-500 text-xs mt-1">{errors[`price_${idx}`]}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t("order.items.total")} ({t("common.pln")})</label>
                    <div className="border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm font-medium text-gray-700">
                      {item.totalPrice.toLocaleString("pl-PL", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          {items.length > 0 && (
            <div className={`flex items-center justify-between p-4 rounded-lg border ${overLimit ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}>
              <div>
                <span className="font-semibold text-gray-900">{t("order.totalValue")}</span>
                {overLimit && (
                  <p className="text-xs text-red-600 mt-0.5">{t("validation.maxValueWarning")}</p>
                )}
              </div>
              <span className={`text-xl font-bold ${overLimit ? "text-red-600" : "text-blue-700"}`}>
                {totalValue.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} {t("common.pln")}
              </span>
            </div>
          )}
          {errors.total && <p className="text-red-500 text-sm">{errors.total}</p>}
        </div>

        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {apiError}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Link
            href="/"
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t("order.back")}
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {submitting ? t("common.loading") : t("order.submit")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense>
      <NewOrderForm />
    </Suspense>
  );
}
