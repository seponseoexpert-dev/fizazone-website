"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  MapPin,
  Moon,
  Phone,
  Search,
  ShoppingCart,
  Sun,
  User,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/components/shop/cart";
import { useCountry, type CountryCode } from "@/lib/country";
import { useActiveCountries } from "@/lib/active-countries";
import { FlagIcon } from "@/components/shop/FlagIcon";

import { MegaMenuPanel, megaTabs } from "@/components/shop/MegaMenu";

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="group grid h-10 w-10 shrink-0 place-items-center rounded-full text-foreground transition-colors hover:text-sale sm:h-11 sm:w-11"
    >
      {children}
    </button>
  );
}

function useLocationDraft(open: boolean, onOpenChange: (v: boolean) => void) {
  const { country, setCountry, markets } = useCountry();
  const router = useRouter();
  const pathname = usePathname() || "/";
  const [draftCode, setDraftCode] = useState<CountryCode>(country.code);

  useEffect(() => {
    if (open) setDraftCode(country.code);
  }, [open, country.code]);

  const handleSave = () => {
    setCountry(draftCode);
    onOpenChange(false);
    // Keep the visitor on the same page, just under the new market prefix.
    const search = typeof window !== "undefined" ? window.location.search : "";
    const segments = pathname.split("/").filter(Boolean);
    const first = segments[0]?.toLowerCase();
    const isMarketPrefix = markets.some((m) => m.prefix === first) || first === "usa";
    const rest = isMarketPrefix ? `/${segments.slice(1).join("/")}` : pathname;
    const cleanRest = rest === "/" ? "" : rest.replace(/\/$/, "");
    router.push(`/${draftCode}${cleanRest}${search}`);
  };

  return { draftCode, setDraftCode, handleSave };
}

function LocationFields({
  draftCode,
  setDraftCode,
  onSave,
  compact,
}: {
  draftCode: CountryCode;
  setDraftCode: (c: CountryCode) => void;
  onSave: () => void;
  compact?: boolean;
}) {
  const countryList = useActiveCountries();
  const triggerCls = compact
    ? "h-11 w-full rounded-xl border-border bg-background px-3 text-sm"
    : "h-12 w-full rounded-xl border-border bg-background px-3 text-sm";

  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">Deliver to</label>
        <Select value={draftCode} onValueChange={(v) => setDraftCode(v as CountryCode)}>
          <SelectTrigger className={triggerCls}>
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent className="z-[60] rounded-xl">
            {countryList.map((c) => (
              <SelectItem key={c.code} value={c.code} className="text-sm">
                <span className="flex items-center gap-3">
                  <FlagIcon code={c.code} className="h-5 w-5" />
                  <span className="flex-1">{c.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">Show prices in</label>
        <Select value={draftCode} onValueChange={(v) => setDraftCode(v as CountryCode)}>
          <SelectTrigger className={triggerCls}>
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent className="z-[60] rounded-xl">
            {countryList.map((c) => (
              <SelectItem key={c.code} value={c.code} className="text-sm">
                <span className="flex items-center gap-3">
                  <FlagIcon code={c.code} className="h-5 w-5" />
                  <span className="flex-1">{c.currency}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={onSave}
        className="h-12 w-full rounded-xl bg-foreground font-semibold text-background hover:bg-foreground/90"
      >
        Save
      </Button>
    </div>
  );
}

/** Desktop / laptop: dropdown anchored under the trigger */
function LocationPopover({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  const { draftCode, setDraftCode, handleSave } = useLocationDraft(open, onOpenChange);

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="z-50 w-[340px] rounded-2xl border-border p-0 shadow-[0_24px_48px_-24px_rgb(0,0,0,0.45)]"
      >
        <div className="border-b border-border px-5 py-3 text-center text-sm font-bold text-foreground">
          Choose your location
        </div>
        <div className="px-5 py-4">
          <LocationFields
            compact
            draftCode={draftCode}
            setDraftCode={setDraftCode}
            onSave={handleSave}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Mobile / tablet: bottom sheet */
function LocationSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { draftCode, setDraftCode, handleSave } = useLocationDraft(open, onOpenChange);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-border px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border" />
        <SheetHeader className="text-left">
          <SheetTitle className="text-base">Choose your location</SheetTitle>
          <SheetDescription className="text-xs">
            Select where you want orders delivered and which currency to display.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5">
          <LocationFields
            compact
            draftCode={draftCode}
            setDraftCode={setDraftCode}
            onSave={handleSave}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}


export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [openTab, setOpenTab] = useState<string | null>(null);
  const [locationOpen, setLocationOpen] = useState(false);
  const [mobileLocationOpen, setMobileLocationOpen] = useState(false);
  const activeTab = megaTabs.find((t) => t.label === openTab);
  const { country, setCountry } = useCountry();
  const { count } = useCart();
  const activeCountries = useActiveCountries();

  // If the stored country was disabled in the admin panel, fall back to an
  // active market so the header never advertises a closed storefront.
  useEffect(() => {
    if (!activeCountries.length) return;
    if (activeCountries.some((c) => c.code === country.code)) return;
    const first = activeCountries[0];
    if (first) setCountry(first.code);
  }, [activeCountries, country.code, setCountry]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      {/* Desktop / laptop header */}
      <div className="hidden lg:block">
        <div className="shop-container flex items-center justify-between gap-6 py-4">
          {/* Logo */}
          <Link to="/" className="shrink-0 leading-none">
            <span className="font-display text-3xl font-extrabold tracking-tight text-sale">
              Faiza
            </span>
            <span className="mt-1 block text-[9px] font-medium uppercase tracking-[0.4em] text-muted-foreground">
              Zone
            </span>
          </Link>

          {/* Search */}
          <div className="relative mx-4 max-w-xl flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search"
              aria-label="Search products"
              className="h-11 w-full rounded-full border border-border bg-secondary pl-10 pr-4 text-sm outline-none transition focus:border-sale"
            />
          </div>

          {/* Right cluster */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Call us */}
            <a
              href="tel:+8801570251628"
              className="mr-2 flex items-center gap-2 rounded-full border border-border px-3 py-2 transition-colors hover:border-sale"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sale/10 text-sale">
                <Phone className="h-3.5 w-3.5" />
              </span>
              <span className="hidden min-w-0 flex-col leading-none xl:flex">
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Call us now
                </span>
                <span className="text-sm font-bold text-foreground">+8801570251628</span>
              </span>
            </a>

            <IconButton label="Toggle dark mode" onClick={() => setDark((d) => !d)}>
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </IconButton>
            <Link
              to="/track-order"
              aria-label="Track order"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-foreground transition-colors hover:text-sale sm:h-11 sm:w-11"
            >
              <MapPin className="h-5 w-5" />
            </Link>

            {/* Location / currency trigger (desktop dropdown) */}
            <LocationPopover open={locationOpen} onOpenChange={setLocationOpen}>
              <button
                type="button"
                aria-label="Choose your location"
                className="flex h-10 items-center gap-2 rounded-full border border-border px-3 py-2 text-foreground transition-colors hover:border-sale sm:h-11"
              >
                <FlagIcon code={country.code} className="h-5 w-5" />
                <span className="hidden flex-col items-start leading-none xl:flex">
                  <span className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                    Deliver To / Currency
                  </span>
                  <span className="text-sm font-bold">
                    {country.code.toUpperCase()} / {country.currency}
                  </span>
                </span>
                <span className="text-sm font-bold xl:hidden">
                  {country.code.toUpperCase()}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${
                    locationOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </LocationPopover>


            <Link
              to="/cart"
              aria-label="Cart"
              className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-foreground transition-colors hover:text-sale sm:h-11 sm:w-11"
            >
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-sale px-1 text-[10px] font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
            <Link
              to="/account"
              aria-label="Account"
              className="grid h-10 w-11 shrink-0 place-items-center rounded-full text-foreground transition-colors hover:text-sale sm:h-11 sm:w-11"
            >
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Category nav + mega menu */}
        <nav
          className="relative border-t border-border"
          onMouseLeave={() => setOpenTab(null)}
        >
          <div className="shop-container flex items-center justify-center gap-10 py-3">
            {megaTabs.map((tab) => (
              <Link
                key={tab.label}
                to="/categories"
                search={{ category: tab.category }}
                onMouseEnter={() => setOpenTab(tab.label)}
                onFocus={() => setOpenTab(tab.label)}
                className={`border-b-2 pb-1 text-sm font-bold tracking-[0.08em] uppercase transition-colors ${
                  openTab === tab.label
                    ? "border-sale text-sale"
                    : "border-transparent text-foreground hover:text-sale"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          {activeTab && (
            <div className="absolute inset-x-0 top-full z-50 border-t border-border bg-background shadow-[0_18px_30px_-18px_rgb(0,0,0,0.35)]">
              <MegaMenuPanel tab={activeTab} onNavigate={() => setOpenTab(null)} />
            </div>
          )}
        </nav>
      </div>


      {/* Mobile / tablet header */}
      <div className="shop-container grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-2.5 lg:hidden">
        <Link to="/" className="min-w-0 leading-none">
          <span className="font-display text-2xl font-extrabold tracking-tight text-sale">
            Faiza
          </span>
          <span className="mt-0.5 block text-[7px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Zone
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-background text-foreground active:scale-95 transition-transform"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Toggle dark mode"
            onClick={() => setDark((d) => !d)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-background text-foreground active:scale-95 transition-transform"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link
            to="/track-order"
            aria-label="Track order"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-background text-foreground active:scale-95 transition-transform"
          >
            <MapPin className="h-4 w-4" />
          </Link>
          <button
            type="button"
            aria-label="Choose your location"
            onClick={() => setMobileLocationOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-2 text-foreground active:scale-95 transition-transform"
          >
            <FlagIcon code={country.code} className="h-4 w-4" />
            <span className="text-xs font-bold">{country.currency}</span>
          </button>
        </div>
      </div>

      {/* Search sheet */}
      <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
        <SheetContent side="top" className="p-6">
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              autoFocus
              placeholder="Search products..."
              aria-label="Search products"
              className="h-11 w-full rounded-full border border-border bg-secondary pl-9 pr-4 text-sm outline-none transition focus:border-sale"
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Location selector bottom sheet (mobile / tablet) */}
      <LocationSheet open={mobileLocationOpen} onOpenChange={setMobileLocationOpen} />
    </header>
  );
}
