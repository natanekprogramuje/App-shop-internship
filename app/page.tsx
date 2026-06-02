"use client";
import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";
import { catalog } from "@/lib/catalog";
import { CatalogItem } from "@/lib/types";

export default function HomePage() {
  const { t, lang } = useLang();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", ...Array.from(new Set(catalog.map((i) => (lang === "pl" ? i.category : i.categoryEn))))];

  const filtered = selectedCategory === "all"
    ? catalog
    : catalog.filter((i) => (lang === "pl" ? i.category : i.categoryEn) === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 mb-8 text-white">
        <h1 className="text-3xl font-bold mb-2">{t("home.hero.title")}</h1>
        <p className="text-blue-100 text-lg mb-6">{t("home.hero.subtitle")}</p>
        <Link
          href="/orders/new"
          className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors"
        >
          <span>+</span>
          {t("home.startOrder")}
        </Link>
      </div>

      {/* Catalog */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t("home.catalog.title")}</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 hidden sm:block">{t("home.catalog.filter")}:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t("home.catalog.all")}</option>
            {categories.filter((c) => c !== "all").map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((item) => (
          <CatalogCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function CatalogCard({ item }: { item: CatalogItem }) {
  const { t, lang } = useLang();
  const name = lang === "pl" ? item.name : item.nameEn;
  const category = lang === "pl" ? item.category : item.categoryEn;
  const description = lang === "pl" ? item.description : item.descriptionEn;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="text-3xl">{item.icon}</span>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{category}</span>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{name}</h3>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{description}</p>
      </div>
      <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-blue-600 font-bold text-lg">
          {item.estimatedPrice.toLocaleString("pl-PL")} {t("common.pln")}
        </span>
        <Link
          href={`/orders/new?item=${item.id}`}
          className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          + {t("order.items.add")}
        </Link>
      </div>
    </div>
  );
}
