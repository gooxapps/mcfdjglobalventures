import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';
import { uploadImageToStorage } from '@/src/services/adminService';
import { useToast } from '@/src/contexts/ToastContext';
import { SafeImage } from '@/src/components/SafeImage';

interface AdminImagePickerProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  bucket: 'product-images' | 'category-images' | 'banners' | 'brand-assets';
  folder?: string;
  hint?: string;
}

export function AdminImagePicker({
  label,
  value,
  onChange,
  bucket,
  folder = 'general',
  hint,
}: AdminImagePickerProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const asset = await uploadImageToStorage(file, bucket, folder);
      onChange(asset.public_url);
      showToast(`Uploaded ${file.name} to Vercel Blob.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Image upload failed.', 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
        {label}
      </label>
      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <div className="w-24 h-24 rounded-lg border border-neutral-200 bg-[#FAF5EE] overflow-hidden shrink-0 flex items-center justify-center">
          {value ? (
            <SafeImage src={value} alt={label} className="w-full h-full object-cover" />
          ) : (
            <ImagePlus className="w-6 h-6 text-neutral-400" />
          )}
        </div>
        <div className="flex-1 w-full space-y-2">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste image URL or upload directly to Vercel Blob"
            className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-xs focus:outline-none focus:border-[#090909]"
          />
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#090909] text-white text-xs font-medium hover:bg-neutral-800 disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4AF5A]" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-[#D4AF5A]" />
              )}
              {uploading ? 'Uploading...' : 'Upload Image'}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-neutral-200 text-xs text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
          {hint && <p className="text-[11px] text-neutral-500">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
