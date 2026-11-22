import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  ShoppingBag,
  UserCheck,
  X,
  MessageCircle,
  Instagram,
  Facebook,
  Youtube,
  Music2,
} from 'lucide-react';
import { BrandLogo } from '@/src/components/BrandLogo';
import { CartDrawer } from '@/src/components/CartDrawer';
import { FloatingWhatsAppButton } from '@/src/components/FloatingWhatsAppButton';
import { useCart } from '@/src/contexts/CartContext';
import { useStore } from '@/src/contexts/StoreContext';
import { isSafeHttpUrl } from '@/src/utils/format';
import { buildWhatsAppUrl, normalizeWhatsAppDigits } from '@/src/utils/whatsapp';

export function StorefrontLayout() {
  const { settings, categories } = useStore();
  const { totalItems, openDrawer } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    setSearchOpen(false);
    setMobileMenuOpen(false);
    navigate(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop');
  };

  const whatsappConfirmed =
    settings.whatsapp_country_confirmed &&
    normalizeWhatsAppDigits(settings.whatsapp_number).length >= 11;

  const whatsappContactUrl = whatsappConfirmed
    ? buildWhatsAppUrl(settings.whatsapp_number, settings.whatsapp_support_message)
    : '/contact';

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Shop', to: '/shop' },
    { label: 'Collections', to: '/collections' },
    { label: 'About Us', to: '/about' },
    { label: 'Contact', to: '/contact' },
  ];

  const socialItems = [
    { label: 'Instagram', url: settings.social_links?.instagram, icon: Instagram },
    { label: 'Facebook', url: settings.social_links?.facebook, icon: Facebook },
    { label: 'TikTok', url: settings.social_links?.tiktok, icon: Music2 },
    { label: 'YouTube', url: settings.social_links?.youtube, icon: Youtube },
  ].filter((s) => isSafeHttpUrl(s.url));

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF5EE] text-[#242424]">
      {/* Slim Announcement Bar */}
      {!bannerDismissed && (
        <div className="bg-[#090909] text-[#FAF5EE] border-b border-[#D4AF5A]/20 text-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-9 flex items-center justify-between gap-4">
            <p className="truncate text-[11px] sm:text-xs text-[#FAF5EE]/90">
              {settings.announcement_text}
            </p>
            <div className="flex items-center gap-4 shrink-0">
              {whatsappConfirmed ? (
                <a
                  href={whatsappContactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 text-[#E8BE62] hover:text-white transition-colors whitespace-nowrap"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp Concierge
                </a>
              ) : (
                <Link
                  to="/contact"
                  className="hidden sm:inline-flex items-center gap-1.5 text-[#E8BE62] hover:text-white transition-colors whitespace-nowrap"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Client Support
                </Link>
              )}
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                aria-label="Dismiss announcement"
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className="sticky top-0 z-30 bg-[#090909]/95 backdrop-blur-md text-white border-b border-[#D4AF5A]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-8">
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 text-neutral-200 hover:text-[#D4AF5A]"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link to="/" aria-label="MCFD J GLOBAL VENTURES Home">
              <BrandLogo variant="dark" size="sm" logoUrl={settings.logo_url} />
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `whitespace-nowrap shrink-0 py-1 border-b transition-colors tracking-wide ${
                    isActive
                      ? 'text-[#E8BE62] border-[#E8BE62]'
                      : 'text-neutral-200 border-transparent hover:text-white hover:border-[#D4AF5A]/50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search products"
              className="p-2.5 rounded-lg text-neutral-200 hover:text-[#E8BE62] hover:bg-white/5 transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
            <Link
              to="/admin"
              aria-label="Administrator Portal"
              title="Store Admin"
              className="p-2.5 rounded-lg text-neutral-200 hover:text-[#E8BE62] hover:bg-white/5 transition-colors"
            >
              <UserCheck className="w-5 h-5" />
            </Link>
            <button
              type="button"
              onClick={openDrawer}
              aria-label="Open shopping bag"
              className="relative inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#D4AF5A] text-[#090909] text-xs font-semibold hover:bg-[#E8BE62] transition-colors whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Bag</span>
              <span className="tabular-nums">({totalItems})</span>
            </button>
          </div>
        </div>

        {/* Expandable Search Bar */}
        {searchOpen && (
          <div className="border-t border-white/10 bg-[#090909] px-4 sm:px-6 py-3.5">
            <form
              onSubmit={handleSearchSubmit}
              className="max-w-3xl mx-auto flex items-center gap-3"
            >
              <Search className="w-4 h-4 text-[#D4AF5A] shrink-0" />
              <input
                type="search"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search dresses, blazers, handbags, footwear, jewellery..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-neutral-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-md bg-[#D4AF5A] text-[#090909] text-xs font-semibold hover:bg-[#E8BE62] transition-colors"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
                className="p-1.5 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-80 max-w-[85vw] bg-[#090909] text-white h-full flex flex-col p-6 border-r border-[#D4AF5A]/25">
            <div className="flex items-center justify-between pb-5 border-b border-white/10">
              <BrandLogo variant="dark" size="sm" logoUrl={settings.logo_url} />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="p-2 text-neutral-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="mt-5 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-[#D4AF5A]" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search catalogue..."
                className="w-full bg-transparent text-sm text-white placeholder:text-neutral-400 focus:outline-none"
              />
            </form>

            <nav className="mt-6 flex flex-col gap-1">
              {navLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#D4AF5A] text-[#090909]'
                        : 'text-neutral-200 hover:bg-white/5'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#D4AF5A] mb-3">
                Categories
              </p>
              <div className="flex flex-col gap-2">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/shop?category=${encodeURIComponent(cat.slug)}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm text-neutral-300 hover:text-white py-1"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-white/10">
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-[#D4AF5A]/40 text-xs font-medium text-[#E8BE62] hover:bg-[#D4AF5A]/10"
              >
                <UserCheck className="w-4 h-4" />
                Administrator Dashboard
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Luxury Footer */}
      <footer className="bg-[#090909] text-[#FAF5EE] border-t border-[#D4AF5A]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-4">
            <BrandLogo variant="dark" size="sm" logoUrl={settings.logo_url} />
            <p className="text-sm text-neutral-300 leading-relaxed">
              {settings.footer_description}
            </p>
            {socialItems.length > 0 && (
              <div className="flex items-center gap-2.5 pt-1">
                {socialItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.label}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.label}
                      className="w-9 h-9 rounded-full bg-white/5 border border-white/15 flex items-center justify-center text-[#E8BE62] hover:bg-[#D4AF5A] hover:text-[#090909] transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-serif text-lg font-semibold text-[#E8BE62] mb-4">
              Navigation
            </h3>
            <ul className="space-y-2.5 text-sm text-neutral-300">
              {(settings.footer_links && settings.footer_links.length > 0
                ? settings.footer_links
                : navLinks.map((n) => ({ label: n.label, url: n.to }))
              ).map((link) => (
                <li key={link.label}>
                  <Link to={link.url} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-lg font-semibold text-[#E8BE62] mb-4">
              Client Care
            </h3>
            <ul className="space-y-2.5 text-sm text-neutral-300">
              <li>
                <Link to="/shipping" className="hover:text-white transition-colors">
                  Shipping &amp; Returns
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-white transition-colors">
                  Shopping Bag
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-lg font-semibold text-[#E8BE62] mb-4">
              Atelier &amp; Concierge
            </h3>
            <div className="space-y-2.5 text-sm text-neutral-300">
              <p>{settings.business_address}</p>
              <p>{settings.service_regions}</p>
              {settings.business_email && (
                <p>
                  <a
                    href={`mailto:${settings.business_email}`}
                    className="text-[#E8BE62] hover:underline"
                  >
                    {settings.business_email}
                  </a>
                </p>
              )}
              {settings.business_phone && <p>{settings.business_phone}</p>}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
            <p>{settings.copyright_text}</p>
            <p className="text-[11px] text-neutral-500">
              Developed by Emmanuel Kenny | StaySafelite
            </p>
          </div>
        </div>
      </footer>

      <CartDrawer />
      <FloatingWhatsAppButton />
    </div>
  );
}
