"use client";
import { OrderStatus } from "@/lib/types";
import { useLang } from "@/contexts/LanguageContext";
import { TranslationKey } from "@/lib/i18n";

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useLang();
  const map: Record<OrderStatus, { cls: string; key: TranslationKey }> = {
    pending: { cls: "bg-yellow-100 text-yellow-800", key: "order.status.pending" },
    approved: { cls: "bg-green-100 text-green-800", key: "order.status.approved" },
    cancelled: { cls: "bg-red-100 text-red-800", key: "order.status.cancelled" },
  };
  const { cls, key } = map[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {t(key)}
    </span>
  );
}
