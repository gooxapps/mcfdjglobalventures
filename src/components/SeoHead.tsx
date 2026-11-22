import { useEffect } from 'react';

interface SeoHeadProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  canonicalPath?: string;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
}

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function SeoHead({
  title,
  description,
  keywords,
  ogImage,
  canonicalPath,
  jsonLd,
}: SeoHeadProps) {
  useEffect(() => {
    document.title = title;
    setMetaTag('name', 'description', description);
    if (keywords) setMetaTag('name', 'keywords', keywords);

    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:site_name', 'MCFD J GLOBAL VENTURES');
    if (ogImage) setMetaTag('property', 'og:image', ogImage);

    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    if (ogImage) setMetaTag('name', 'twitter:image', ogImage);

    const origin = window.location.origin;
    const canonicalUrl = `${origin}${canonicalPath ?? window.location.pathname}`;
    setMetaTag('property', 'og:url', canonicalUrl);

    let linkEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!linkEl) {
      linkEl = document.createElement('link');
      linkEl.setAttribute('rel', 'canonical');
      document.head.appendChild(linkEl);
    }
    linkEl.setAttribute('href', canonicalUrl);

    const scriptId = 'mcfdj-json-ld';
    const existingScript = document.getElementById(scriptId);
    if (existingScript) existingScript.remove();

    if (jsonLd) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, keywords, ogImage, canonicalPath, jsonLd]);

  return null;
}
