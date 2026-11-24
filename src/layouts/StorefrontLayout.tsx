import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronDown,
  Facebook,
  Globe,
  Headphones,
  Instagram,
  Lock,
  Menu,
  Music2,
  Search,
  ShoppingCart,
  X,
  Youtube,
} from 'lucide-react';
import { BrandLogo } from '@/src/components/BrandLogo';
import { CartDrawer } from '@/src/components/CartDrawer';
import { FloatingWhatsAppButton } from '@/src/components/FloatingWhatsAppButton';
import { MobileBottomNav } from '@/src/components/MobileBottomNav';
import { useCart } from '@/src/contexts/CartContext';
import { useStore } from '@/src/contexts/StoreContext';
import { isSafeHttpUrl } from '@/src/utils/format';
import { buildWhatsAppUrl, normalizeWhatsAppDigits } from '@/src/utils/whatsapp';

export function StorefrontLayout() {
  const { settings, categories } = useStore();
  const { totalItems, openDrawer } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [promoIndex, setPromoIndex] = useState(0);
  const navigate = useNavigate();

  const announcementSlides = [
    settings.announcement_text,
    ...(settings.promo_messages || []),
  ]
    .map((m) => (m || '').trim())
    .filter((m, idx, arr) => m.length > 0 && arr.indexOf(m) === idx);

  useEffect(() => {
    if (announcementSlides.length <= 1) return;
    const timer = window.setInterval(() => {
      setPromoIndex((i) => (i + 1) % announcementSlides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [announcementSlides.length]);

  const activeAnnouncement =
    announcementSlides[promoIndex % Math.max(1, announcementSlides.length)] ||
    settings.announcement_text;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    setMobileSearchOpen(false);
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
    { label: 'Shop', to: '/shop', hasCategories: true },
    { label: 'Collections', to: '/collections' },
    { label: 'About Us', to: '/about' },
    { label: 'Contact', to: '/contact' },
  ];

  const socialItems = [
    { label: 'Facebook', url: settings.social_links?.facebook, icon: Facebook },
    { label: 'Instagram', url: settings.social_links?.instagram, icon: Instagram },
    { label: 'TikTok', url: settings.social_links?.tiktok, icon: Music2 },
    { label: 'YouTube', url: settings.social_links?.youtube, icon: Youtube },
  ].filter((s) => isSafeHttpUrl(s.url));

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF5EE] text-[#242424] overflow-x-clip">
      {/* Top Announcement Bar matching Luxury Header Design */}
      {!bannerDismissed && (
        <div className="bg-[#090909] text-[#FAF5EE] border-b border-[#D4AF5A]/20 text-[11px] sm:text-xs">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 min-h-[36px] py-1.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
              <Globe className="w-3.5 h-3.5 text-[#D4AF5A] shrink-0" />
              <AnimatePresence mode="wait">
                <motion.span
                  key={activeAnnouncement}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="text-[#FAF5EE]/90 truncate block"
                >
                  {activeAnnouncement}
                </motion.span>
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {whatsappConfirmed ? (
                <a
                  href={whatsappContactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 text-[#E8BE62] hover:text-white transition-colors whitespace-nowrap"
                >
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Need Help? WhatsApp Concierge</span>
                </a>
              ) : (
                <Link
                  to="/contact"
                  className="hidden sm:inline-flex items-center gap-1.5 text-[#E8BE62] hover:text-white transition-colors whitespace-nowrap"
                >
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Client Concierge</span>
                </Link>
              )}

              {socialItems.length > 0 && (
                <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-white/15">
                  {socialItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={item.label}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={item.label}
                        className="text-neutral-300 hover:text-[#E8BE62] transition-colors"
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </a>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                aria-label="Dismiss announcement"
                className="text-neutral-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className="sticky top-0 z-30 bg-[#090909]/95 backdrop-blur-md text-white border-b border-[#D4AF5A]/25">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-20 flex items-center justify-between gap-2 sm:gap-6">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-1 text-neutral-200 hover:text-[#D4AF5A]"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link to="/" aria-label="MCFD J GLOBAL VENTURES Home">
              <BrandLogo variant="dark" size="sm" logoUrl={settings.logo_url} />
            </Link>
          </div>

          {/* Desktop Navigation with Sleek Gold Underline on Active Link */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-medium">
            {navLinks.map((item) =>
              item.hasCategories ? (
                <div
                  key={item.to}
                  className="relative"
                  onMouseEnter={() => setShopDropdownOpen(true)}
                  onMouseLeave={() => setShopDropdownOpen(false)}
                >
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `inline-flex items-center gap-1 whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors tracking-wide ${
                        isActive
                          ? 'border-[#D4AF5A] text-[#E8BE62] font-semibold'
                          : 'border-transparent text-neutral-200 hover:text-[#E8BE62]'
                      }`
                    }
                  >
                    {item.label}
                    <ChevronDown className="w-3.5 h-3.5" />
                  </NavLink>

                  <AnimatePresence>
                    {shopDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute left-0 top-full pt-2 w-56 z-40"
                      >
                        <div className="bg-[#121212] border border-[#D4AF5A]/30 rounded-xl shadow-2xl p-2 space-y-0.5">
                          <Link
                            to="/shop"
                            onClick={() => setShopDropdownOpen(false)}
                            className="block px-3 py-2 rounded-lg text-xs font-semibold text-[#E8BE62] hover:bg-white/5"
                          >
                            All Luxury Pieces
                          </Link>
                          {categories.map((cat) => (
                            <Link
                              key={cat.id}
                              to={`/shop?category=${encodeURIComponent(cat.slug)}`}
                              onClick={() => setShopDropdownOpen(false)}
                              className="block px-3 py-2 rounded-lg text-xs text-neutral-200 hover:bg-white/5 hover:text-[#E8BE62]"
                            >
                              {cat.name}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors tracking-wide ${
                      isActive
                        ? 'border-[#D4AF5A] text-[#E8BE62] font-semibold'
                        : 'border-transparent text-neutral-200 hover:text-[#E8BE62]'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              )
            )}
          </nav>

          {/* Right Controls: Pill Search, Admin Access, Shopping Bag */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex items-center bg-white/5 border border-white/15 focus-within:border-[#D4AF5A] rounded-full px-3.5 py-1.5 w-44 xl:w-56 transition-colors"
            >
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-transparent text-xs text-white placeholder:text-neutral-400 focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Submit search"
                className="text-neutral-300 hover:text-[#E8BE62] ml-1.5 shrink-0"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            <button
              type="button"
              onClick={() => setMobileSearchOpen((v) => !v)}
              aria-label="Search products"
              className="md:hidden p-2 rounded-lg text-neutral-200 hover:text-[#E8BE62] hover:bg-white/5 transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={openDrawer}
              aria-label="Open shopping bag"
              className="relative inline-flex items-center justify-center p-2 sm:p-2.5 rounded-full text-white hover:text-[#E8BE62] hover:bg-white/5 transition-colors shrink-0"
            >
              <ShoppingCart className="w-5 h-5" />
              <motion.span
                key={totalItems}
                initial={{ scale: 0.75 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 460, damping: 22 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#DC2626] text-white text-[10px] font-bold flex items-center justify-center tabular-nums"
              >
                {totalItems}
              </motion.span>
            </button>
          </div>
        </div>

        {/* Expandable Mobile Search Bar */}
        <AnimatePresence>
          {mobileSearchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden border-t border-white/10 bg-[#090909] px-4 py-3"
            >
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-[#D4AF5A] shrink-0" />
                <input
                  type="search"
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search dresses, handbags, footwear..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-neutral-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-full bg-[#D4AF5A] text-[#090909] text-xs font-semibold"
                >
                  Go
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-80 max-w-[85vw] bg-[#090909] text-white h-full flex flex-col p-5 border-r border-[#D4AF5A]/25 overflow-y-auto"
            >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
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

            <form
              onSubmit={handleSearchSubmit}
              className="mt-4 flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3.5 py-2"
            >
              <Search className="w-4 h-4 text-[#D4AF5A]" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search catalogue..."
                className="w-full bg-transparent text-sm text-white placeholder:text-neutral-400 focus:outline-none"
              />
            </form>

            <nav className="mt-5 flex flex-col gap-1">
              {navLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-3.5 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#D4AF5A] text-[#090909] font-semibold'
                        : 'text-neutral-200 hover:bg-white/5'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-6 pt-5 border-t border-white/10">
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
                to="/shop"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-[#D4AF5A] text-[#090909] text-xs font-semibold hover:bg-[#E8BE62] transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                Browse Full Boutique
              </Link>
            </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Luxury Black & Gold Footer */}
      <footer className="bg-[#090909] text-[#FAF5EE] border-t border-[#D4AF5A]/25 pb-32 lg:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
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
                      className="w-9 h-9 rounded-full bg-[#D4AF5A] text-[#090909] flex items-center justify-center hover:bg-[#E8BE62] transition-colors"
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
                    className="text-[#E8BE62] hover:underline break-all"
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <p>{settings.copyright_text}</p>
              <Link
                to="/admin"
                aria-label="Admin Portal"
                title="Admin"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#D4AF5A]/25 text-[11px] text-neutral-400 hover:text-[#E8BE62] hover:border-[#D4AF5A]/60 transition-colors"
              >
                <Lock className="w-3 h-3 text-[#D4AF5A]" />
                <span>Admin</span>
              </Link>
            </div>
            <p className="text-[11px] text-neutral-500">
              Developed by Emmanuel Kenny | StaySafelite
            </p>
          </div>
        </div>
      </footer>

      <CartDrawer />
      <FloatingWhatsAppButton />
      <MobileBottomNav />
    </div>
  );
}
