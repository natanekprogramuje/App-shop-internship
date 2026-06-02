"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/contexts/LanguageContext";

export default function Navbar() {
  const { t, lang, setLang } = useLang();
  const pathname = usePathname();

  const links = [
    { href: "/", label: t("nav.home") },
    { href: "/orders", label: t("nav.orders") },
    { href: "/admin", label: t("nav.admin") },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
              <span>🏢</span>
              <span className="hidden sm:block">{t("nav.appName")}</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {links.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === href
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/orders/new"
              className="hidden sm:inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <span>+</span>
              {t("nav.newOrder")}
            </Link>
            <button
              onClick={() => setLang(lang === "pl" ? "en" : "pl")}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {t("lang.switch")}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex gap-1 pb-2">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex-1 text-center px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                pathname === href
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
