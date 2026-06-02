# Sklep Firmowy / Company Shop

Wewnętrzny sklep do zamawiania sprzętu biurowego (myszki, monitory, klawiatury itp.)  
Internal shop for ordering office equipment (mice, monitors, keyboards, etc.)

## Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Stub DB** — dane persystowane w `data/orders.json`
- Brak autentykacji / No authentication required

## Funkcjonalności / Features

| PL | EN |
|---|---|
| Przeglądanie katalogu sprzętu (12 pozycji) | Browse equipment catalog (12 items) |
| Tworzenie zamówienia | Create an order |
| Przeglądanie zamówień (filtry po statusie i priorytecie) | Browse orders (filter by status & priority) |
| Edytowanie zamówień oczekujących | Edit pending orders |
| Anulowanie zamówień | Cancel orders |
| Panel admina — zatwierdzanie / odrzucanie | Admin panel — approve / reject orders |
| Limit wartości 5 000 zł (chyba że priorytet Wysoki) | 5,000 PLN value limit (unless High priority) |
| Ilość przedmiotów: 1–20 | Item quantity: 1–20 |
| Interfejs PL / EN | Polish / English UI |

## Uruchomienie / Getting Started

```bash
npm install
npm run dev
```

Otwórz / Open: [http://localhost:3000](http://localhost:3000)

### Produkcja / Production build

```bash
npm run build
npm start
```

## Struktura projektu / Project Structure

```
app/
├── page.tsx                  # Strona główna — katalog sprzętu
├── orders/
│   ├── page.tsx              # Lista zamówień
│   ├── new/page.tsx          # Nowe zamówienie
│   └── [id]/page.tsx         # Szczegóły / edycja zamówienia
├── admin/page.tsx            # Panel administratora
└── api/
    ├── catalog/route.ts      # GET /api/catalog
    └── orders/
        ├── route.ts          # GET, POST /api/orders
        ├── [id]/route.ts     # GET, PUT, DELETE /api/orders/:id
        └── [id]/approve/     # POST /api/orders/:id/approve
lib/
├── types.ts                  # Typy TypeScript
├── catalog.ts                # Dane katalogu (PL/EN)
├── db.ts                     # Stub bazy danych (JSON file)
└── i18n.ts                   # Tłumaczenia PL/EN
components/
├── Navbar.tsx
├── StatusBadge.tsx
└── PriorityBadge.tsx
contexts/
└── LanguageContext.tsx       # Kontekst języka
```

## Model danych / Data Model

```typescript
interface Order {
  id: string;
  employeeName: string;       // Imię i nazwisko pracownika
  department: string;         // Dział
  justification: string;      // Uzasadnienie zamówienia
  priority: 'low' | 'medium' | 'high';
  items: OrderItem[];
  status: 'pending' | 'approved' | 'cancelled';
  totalValue: number;
  createdAt: string;
  updatedAt: string;
  adminNote?: string;
}

interface OrderItem {
  catalogItemId: string;
  name: string;
  quantity: number;           // 1–20
  unitPrice: number;
  totalPrice: number;
}
```

## Reguły biznesowe / Business Rules

- Wartość zamówienia nie może przekraczać **5 000 zł**, chyba że priorytet to **Wysoki**
- Ilość każdego przedmiotu mieści się w przedziale **1–20**
- Edycja możliwa tylko dla zamówień o statusie **oczekujące**
- Anulować można zamówienia oczekujące i zatwierdzone

---

*Brak autentykacji — aplikacja przeznaczona do użytku wewnętrznego*
