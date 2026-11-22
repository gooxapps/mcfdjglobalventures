import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  DEFAULT_CATEGORIES_FALLBACK,
  DEFAULT_HOMEPAGE_SECTIONS,
  DEFAULT_SITE_SETTINGS,
} from '@/src/lib/defaults';
import { fetchStorefrontBootstrap } from '@/src/services/storefrontService';
import type {
  Banner,
  Category,
  HomepageSection,
  SiteSettings,
  Testimonial,
} from '@/src/types/store';

interface StoreContextValue {
  settings: SiteSettings;
  sections: HomepageSection[];
  categories: Category[];
  banners: Banner[];
  testimonials: Testimonial[];
  supabaseConnected: boolean;
  loading: boolean;
  refreshStore: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [sections, setSections] = useState<HomepageSection[]>(DEFAULT_HOMEPAGE_SECTIONS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES_FALLBACK);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshStore = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchStorefrontBootstrap();
      setSettings(data.settings);
      setSections(data.sections);
      setCategories(data.categories);
      setBanners(data.banners);
      setTestimonials(data.testimonials);
      setSupabaseConnected(data.supabaseConnected);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStore();
  }, [refreshStore]);

  return (
    <StoreContext.Provider
      value={{
        settings,
        sections,
        categories,
        banners,
        testimonials,
        supabaseConnected,
        loading,
        refreshStore,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
