import React from 'react';
import { NavLink } from 'react-router-dom';
import { Crown, Home, Palette, ShoppingBag, Store } from 'lucide-react';
import { useCart } from '@/src/contexts/CartContext';

export function MobileBottomNav() {
  const { totalItems, openDrawer } = useCart();

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="no-print lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#250628]/95 backdrop-blur-md border-t border-[#D4AF5A]/30 text-neutral-200 shadow-[0_-6px_24px_rgba(37,6,40,0.38)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-5 h-15">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
              isActive ? 'text-[#E8BE62]' : 'text-neutral-200 hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Home className={`w-4 h-4 ${isActive ? 'text-[#E8BE62]' : ''}`} />
              <span>Home</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/shop"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
              isActive ? 'text-[#E8BE62]' : 'text-neutral-200 hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Store className={`w-4 h-4 ${isActive ? 'text-[#E8BE62]' : ''}`} />
              <span>Shop</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/custom-design"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
              isActive ? 'text-[#E8BE62]' : 'text-neutral-200 hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Palette className={`w-4 h-4 ${isActive ? 'text-[#E8BE62]' : ''}`} />
              <span>Custom</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/aso-oke"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
              isActive ? 'text-[#E8BE62]' : 'text-neutral-200 hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Crown className={`w-4 h-4 ${isActive ? 'text-[#E8BE62]' : ''}`} />
              <span>Aso Oke</span>
            </>
          )}
        </NavLink>

        <button
          type="button"
          onClick={openDrawer}
          className="relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-neutral-200 hover:text-[#E8BE62] transition-colors"
        >
          <span className="relative">
            <ShoppingBag className="w-4 h-4" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-[#D4AF5A] text-[#250628] text-[9px] font-bold flex items-center justify-center tabular-nums">
                {totalItems}
              </span>
            )}
          </span>
          <span>Bag</span>
        </button>
      </div>
    </nav>
  );
}
