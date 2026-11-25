-- Set official brand logo & favicon defaults on site_settings when blank
update public.site_settings
set
  logo_url = case
    when coalesce(trim(logo_url), '') = '' then '/assets/aistudio/image_d50773ba.png'
    else logo_url
  end,
  favicon_url = case
    when coalesce(trim(favicon_url), '') = '' then '/assets/aistudio/image_d50773ba.png'
    else favicon_url
  end;
