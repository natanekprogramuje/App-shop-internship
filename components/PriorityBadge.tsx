"use client";
import { Priority } from "@/lib/types";
import { useLang } from "@/contexts/LanguageContext";
import { TranslationKey } from "@/lib/i18n";

export default function PriorityBadge({ priority }: { priority: Priority }) {
  const { t } = useLang();
  const map: Record<Priority, { cls: string; key: TranslationKey }> = {
    low: { cls: "bg-gray-100 text-gray-700", key: "order.priority.low" },
    medium: { cls: "bg-blue-100 text-blue-700", key: "order.priority.medium" },
    high: { cls: "bg-red-100 text-red-700", key: "order.priority.high" },
  };
  const { cls, key } = map[priority];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {t(key)}
    </span>
  );
}
