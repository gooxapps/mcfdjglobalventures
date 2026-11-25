import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronDown,
  Crown,
  Facebook,
  Headphones,
  Instagram,
  Lock,
  Menu,
  MessageCircle,
  Music2,
  Search,
  ShieldCheck,
  ShoppingCart,
  Truck,
  User,
  X,
  Youtube,
} from 'lucide-react';
import { BrandLogo } from '@/src/components/BrandLogo';
import { CartDrawer } from '@/src/components/CartDrawer';
import { FloatingWhatsAppButton } from '@/src/components/FloatingWhatsAppButton';
import { MobileBottomNav } from '@/src/components/MobileBottomNav';
import { useCart } from '@/src/contexts/CartContext';
import { useStore } from '@/src/contexts/StoreContext';
import { useToast } from '@/src/contexts/ToastContext';
import { subscribeToNewsletter } from '@/src/services/storefrontService';
import { isSafeHttpUrl } from '@/src/utils/format';
import { buildWhatsAppUrl, normalizeWhatsAppDigits } from '@/src/utils/whatsapp';

export function StorefrontLayout() {
  const { settings, categories, databaseConnected } = useStore();
  const { totalItems, openDrawer } = useCart();
  const { showToast } = useToast();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchBarOpen, setSearchBarOpen] = useState(false);
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
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
    }, 5200);
    return () => window.clearInterval(timer);
  }, [announcementSlides.length]);

  const activeAnnouncement =
    announcementSlides[promoIndex % Math.max(1, announcementSlides.length)] ||
    settings.tagline;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    setSearchBarOpen(false);
    setMobileMenuOpen(false);
    navigate(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop');
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribing(true);
    try {
      if (!databaseConnected) {
        showToast(
          `Thank you! ${newsletterEmail.trim()} is noted (connect Neon DB to persist newsletter dispatch).`
        );
        setNewsletterEmail('');
      } else {
        await subscribeToNewsletter(newsletterEmail);
        showToast('Thank you for joining MCFD J Global Ventures updates & offers.');
        setNewsletterEmail('');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to subscribe.', 'error');
    } finally {
      setSubscribing(false);
    }
  };

  const digits = normalizeWhatsAppDigits(settings.whatsapp_number);
  const whatsappTargetDigits = digits.length === 10 ? `1${digits}` : digits;
  const whatsappChatUrl =
    whatsappTargetDigits.length >= 10
      ? buildWhatsAppUrl(whatsappTargetDigits, settings.whatsapp_support_message)
      : '/contact';

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Shop', to: '/shop', hasCategories: true },
    { label: 'Custom Design', to: '/custom-design' },
    { label: 'Aso Oke', to: '/aso-oke' },
    { label: 'Group Outfits', to: '/group-outfits' },
    { label: 'Souvenirs', to: '/souvenirs' },
    { label: 'Beauty', to: '/beauty' },
    { label: 'About', to: '/about' },
    { label: 'Contact', to: '/contact' },
  ];

  const socialItems = [
    { label: 'Facebook', url: settings.social_links?.facebook, icon: Facebook },
    { label: 'Instagram', url: settings.social_links?.instagram, icon: Instagram },
    { label: 'TikTok', url: settings.social_links?.tiktok, icon: Music2 },
    { label: 'YouTube', url: settings.social_links?.youtube, icon: Youtube },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF5EE] text-[#242424] overflow-x-clip">
      {/* Top Deep Purple Announcement Bar */}
      <div className="bg-[#250628] text-white border-b border-[#D4AF5A]/25 text-[11px] sm:text-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 min-h-[38px] py-1.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            <Crown className="w-3.5 h-3.5 text-[#E8BE62] shrink-0" />
            <span className="font-serif font-semibold text-white whitespace-nowrap shrink-0">
              MCFD J Global Ventures
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={activeAnnouncement}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="italic text-[#F3E6D3]/85 truncate hidden sm:inline"
              >
                {activeAnnouncement}
              </motion.span>
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-4 lg:gap-5 shrink-0">
            <div className="hidden lg:flex items-center gap-5 text-[11px] text-[#F5EFE6]/90">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <Truck className="w-3.5 h-3.5 text-[#E8BE62]" />
                Fast Delivery
              </span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <ShieldCheck className="w-3.5 h-3.5 text-[#E8BE62]" />
                Premium Quality
              </span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <Headphones className="w-3.5 h-3.5 text-[#E8BE62]" />
                Customer Focus
              </span>
            </div>

            {typeof whatsappChatUrl === 'string' && whatsappChatUrl.startsWith('http') ? (
              <a
                href={whatsappChatUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md bg-[#1EA34D] hover:bg-[#17873E] text-white text-[11px] font-semibold transition-colors whitespace-nowrap shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-current" />
                <span>Chat on WhatsApp</span>
              </a>
            ) : (
              <Link
                to="/contact"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md bg-[#1EA34D] hover:bg-[#17873E] text-white text-[11px] font-semibold transition-colors whitespace-nowrap"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-current" />
                <span>Chat on WhatsApp</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Warm Cream Navigation Header */}
      <header className="sticky top-0 z-30 bg-[#FCF8F2]/95 backdrop-blur-md text-[#2D0D31] border-b border-[#E8DCCA]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-1 text-[#3B0E3F] hover:text-[#9A6B19]"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link to="/" aria-label="MCFD J Global Ventures Home">
              <BrandLogo variant="light" size="sm" logoUrl={settings.logo_url} />
            </Link>
          </div>

          {/* Single-Line Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-3.5 xl:gap-6 text-[13px] font-medium">
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
                      `inline-flex items-center gap-0.5 whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors ${
                        isActive
                          ? 'border-[#C89635] text-[#2D0D31] font-semibold'
                          : 'border-transparent text-[#3B263D] hover:text-[#9A6B19]'
                      }`
                    }
                  >
                    {item.label}
                    <ChevronDown className="w-3.5 h-3.5 text-[#8A6D46]" />
                  </NavLink>

                  <AnimatePresence>
                    {shopDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute left-0 top-full pt-2 w-60 z-40"
                      >
                        <div className="bg-[#FCF8F2] border border-[#E5D5C0] rounded-xl shadow-2xl p-2 space-y-0.5">
                          <Link
                            to="/shop"
                            onClick={() => setShopDropdownOpen(false)}
                            className="block px-3 py-2 rounded-lg text-xs font-semibold text-[#3B0E3F] bg-[#F5ECDF] hover:bg-[#EBDDCA]"
                          >
                            Browse All Collections
                          </Link>
                          {categories.map((cat) => (
                            <Link
                              key={cat.id}
                              to={`/shop?category=${encodeURIComponent(cat.slug)}`}
                              onClick={() => setShopDropdownOpen(false)}
                              className="block px-3 py-2 rounded-lg text-xs text-[#2D0D31] hover:bg-[#F3E9DB] hover:text-[#9A6B19]"
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
                    `whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors ${
                      isActive
                        ? 'border-[#C89635] text-[#2D0D31] font-semibold'
                        : 'border-transparent text-[#3B263D] hover:text-[#9A6B19]'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              )
            )}
          </nav>

          {/* Right Utility Icons: Search, Account, Cart */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSearchBarOpen((v) => !v)}
              aria-label="Toggle product search"
              className="p-2 rounded-full text-[#2D0D31] hover:text-[#9A6B19] hover:bg-[#EFE4D6] transition-colors"
            >
              <Search className="w-[18px] h-[18px]" />
            </button>

            <Link
              to="/admin"
              aria-label="Account & Admin Portal"
              title="Account & Admin"
              className="p-2 rounded-full text-[#2D0D31] hover:text-[#9A6B19] hover:bg-[#EFE4D6] transition-colors"
            >
              <User className="w-[18px] h-[18px]" />
            </Link>

            <button
              type="button"
              onClick={openDrawer}
              aria-label="Open shopping bag"
              className="relative inline-flex items-center justify-center p-2 rounded-full text-[#2D0D31] hover:text-[#9A6B19] hover:bg-[#EFE4D6] transition-colors shrink-0"
            >
              <ShoppingCart className="w-[18px] h-[18px]" />
              <motion.span
                key={totalItems}
                initial={{ scale: 0.75 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 460, damping: 22 }}
                className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#B91C1C] text-white text-[10px] font-bold flex items-center justify-center tabular-nums"
              >
                {totalItems}
              </motion.span>
            </button>
          </div>
        </div>

        {/* Expandable Inline Search Drawer */}
        <AnimatePresence>
          {searchBarOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="border-t border-[#E8DCCA] bg-[#FAF3E8] px-4 py-3"
            >
              <form
                onSubmit={handleSearchSubmit}
                className="max-w-3xl mx-auto flex items-center gap-2.5 bg-white border border-[#DECBAE] rounded-full px-4 py-2 shadow-2xs"
              >
                <Search className="w-4 h-4 text-[#9A6B19] shrink-0" />
                <input
                  type="search"
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search Aso Oke, Agbada, hair elixirs, group packs, souvenirs..."
                  className="flex-1 bg-transparent text-sm text-[#2D0D31] placeholder:text-neutral-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full bg-[#3B0E3F] text-[#E8BE62] text-xs font-semibold hover:bg-[#4A124E] transition-colors"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setSearchBarOpen(false)}
                  aria-label="Close search"
                  className="p-1 text-neutral-400 hover:text-[#2D0D31]"
                >
                  <X className="w-4 h-4" />
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
              className="fixed inset-0 bg-[#1B051F]/65"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-80 max-w-[85vw] bg-[#250628] text-white h-full flex flex-col p-5 border-r border-[#D4AF5A]/25 overflow-y-auto"
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
                className="mt-4 flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3.5 py-2"
              >
                <Search className="w-4 h-4 text-[#E8BE62]" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search store..."
                  className="w-full bg-transparent text-sm text-white placeholder:text-neutral-300 focus:outline-none"
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
                      `px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[#D4AF5A] text-[#250628] font-semibold'
                          : 'text-neutral-100 hover:bg-white/10'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="mt-6 pt-5 border-t border-white/10">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#E8BE62] mb-3">
                  Collections
                </p>
                <div className="flex flex-col gap-2">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/shop?category=${encodeURIComponent(cat.slug)}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-sm text-neutral-200 hover:text-[#E8BE62] py-0.5"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-white/10 space-y-2.5">
                <Link
                  to="/custom-design"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-gradient-to-r from-[#E8BE62] to-[#C89635] text-[#250628] text-xs font-bold"
                >
                  Request Custom Design
                </Link>
                <Link
                  to="/shop"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-white/20 text-white text-xs font-semibold"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Browse Shop
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

      {/* Deep Purple & Burgundy Footer with Gold Sweeping Curves */}
      <footer
        className="relative overflow-hidden text-white pt-10 sm:pt-14 pb-24 lg:pb-8"
        style={{
          background:
            'linear-gradient(125deg, #250628 0%, #3E0D40 52%, #5A153C 100%)',
        }}
      >
        {/* Decorative Gold Wave Curves matching Official Visual Reference */}
        <svg
          viewBox="0 0 1440 160"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-x-0 bottom-0 w-full h-24 sm:h-32 opacity-40"
          aria-hidden="true"
        >
          <path
            d="M0,120 C340,165 780,75 1440,115"
            fill="none"
            stroke="#D4AF5A"
            strokeWidth="2.2"
          />
          <path
            d="M0,145 C420,90 980,155 1440,85"
            fill="none"
            stroke="#E8BE62"
            strokeWidth="1.4"
            strokeOpacity="0.7"
          />
        </svg>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10 pb-8 border-b border-white/10">
          {/* Column 1: Logo & Tagline */}
          <div className="lg:col-span-4 space-y-3">
            <BrandLogo variant="dark" size="md" logoUrl={settings.logo_url} />
            <p className="text-xs italic text-[#F3E6D3]">
              {settings.tagline || '...Your Style. Your Identity. Custom Made.'}
            </p>
            <p className="text-xs text-neutral-300 leading-relaxed max-w-xs">
              {settings.footer_description}
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="lg:col-span-2">
            <h3 className="font-serif text-lg font-semibold text-white mb-3.5">
              Quick Links
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-neutral-200">
              <li>
                <Link to="/" className="hover:text-[#E8BE62] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-[#E8BE62] transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/custom-design" className="hover:text-[#E8BE62] transition-colors">
                  Custom Design
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#E8BE62] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#E8BE62] transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Our Services */}
          <div className="lg:col-span-2">
            <h3 className="font-serif text-lg font-semibold text-white mb-3.5">
              Our Services
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-neutral-200">
              <li>
                <Link to="/beauty" className="hover:text-[#E8BE62] transition-colors">
                  Fashion &amp; Beauty
                </Link>
              </li>
              <li>
                <Link to="/aso-oke" className="hover:text-[#E8BE62] transition-colors">
                  Aso Oke
                </Link>
              </li>
              <li>
                <Link to="/group-outfits" className="hover:text-[#E8BE62] transition-colors">
                  Group Outfits
                </Link>
              </li>
              <li>
                <Link to="/souvenirs" className="hover:text-[#E8BE62] transition-colors">
                  Branding &amp; Souvenirs
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="hover:text-[#E8BE62] transition-colors">
                  Shipping &amp; Policies
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Stay Connected Newsletter & Social Circles */}
          <div className="lg:col-span-4 space-y-3.5">
            <div>
              <h3 className="font-serif text-lg font-semibold text-white">
                Stay Connected
              </h3>
              <p className="text-xs text-neutral-200 mt-0.5">
                Subscribe for updates and offers!
              </p>
            </div>

            <form
              onSubmit={handleNewsletterSubmit}
              className="flex flex-col sm:flex-row gap-2"
            >
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 px-3.5 py-2.5 rounded-lg bg-white text-xs sm:text-sm text-[#242424] placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF5A]"
              />
              <button
                type="submit"
                disabled={subscribing}
                className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#E8BE62] to-[#C89635] text-[#250628] text-xs font-bold hover:brightness-105 disabled:opacity-60 transition-all whitespace-nowrap cursor-pointer"
              >
                {subscribing ? 'Joining...' : 'Subscribe'}
              </button>
            </form>

            {/* Social & WhatsApp Circles */}
            <div className="flex items-center gap-2.5 pt-1">
              {socialItems.map((item) => {
                const Icon = item.icon;
                const activeHref = isSafeHttpUrl(item.url) ? item.url : null;
                return activeHref ? (
                  <a
                    key={item.label}
                    href={activeHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    className="w-8 h-8 rounded-full bg-white text-[#250628] flex items-center justify-center hover:bg-[#E8BE62] transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ) : (
                  <Link
                    key={item.label}
                    to="/contact"
                    aria-label={item.label}
                    className="w-8 h-8 rounded-full bg-white text-[#250628] flex items-center justify-center hover:bg-[#E8BE62] transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </Link>
                );
              })}

              {typeof whatsappChatUrl === 'string' && whatsappChatUrl.startsWith('http') ? (
                <a
                  href={whatsappChatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp Chat"
                  className="w-8 h-8 rounded-full bg-white text-[#1EA34D] flex items-center justify-center hover:bg-[#E8BE62] hover:text-[#250628] transition-colors"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                </a>
              ) : (
                <Link
                  to="/contact"
                  aria-label="WhatsApp Concierge"
                  className="w-8 h-8 rounded-full bg-white text-[#1EA34D] flex items-center justify-center hover:bg-[#E8BE62] hover:text-[#250628] transition-colors"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Copyright, Subtle Admin Portal, and Required Developer Credit */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-neutral-300">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <span>{settings.copyright_text}</span>
            <Link
              to="/privacy"
              className="text-neutral-300 hover:text-[#E8BE62] transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-neutral-300 hover:text-[#E8BE62] transition-colors"
            >
              Terms
            </Link>
            <Link
              to="/admin"
              aria-label="Admin Portal"
              title="Admin"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-[#D4AF5A]/30 text-neutral-200 hover:text-[#E8BE62] hover:border-[#D4AF5A] transition-colors"
            >
              <Lock className="w-3 h-3 text-[#D4AF5A]" />
              <span>Admin</span>
            </Link>
          </div>
          <p className="text-[11px] text-neutral-200/90 font-medium">
            Developed by Emmanuel Kenny | StaySafelite
          </p>
        </div>
      </footer>

      <CartDrawer />
      <FloatingWhatsAppButton />
      <MobileBottomNav />
    </div>
  );
}
