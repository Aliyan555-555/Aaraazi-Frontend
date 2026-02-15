/**
 * ImageUpload Component
 * Property images: upload via backend (backend uses Cloudinary) or add by URL
 */

import React, { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Upload, Link as LinkIcon, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { propertiesApi } from '@/lib/api/properties';

function normalizeImages(images: string[] | string | undefined | null): string[] {
  if (Array.isArray(images)) return images;
  if (typeof images === 'string') return images.split(',').map((s: string) => s.trim()).filter(Boolean);
  return [];
}

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  images: imagesProp,
  onImagesChange,
  maxImages = 10,
}) => {
  const images = useMemo(() => normalizeImages(imagesProp), [imagesProp]);
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  /**
   * Handle file upload via backend (backend uploads to Cloudinary)
   */
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB)`);
          continue;
        }

        setUploadProgress(Math.round(((i + 0.5) / files.length) * 100));

        const { url } = await propertiesApi.uploadImage(file);
        uploadedUrls.push(url);

        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      if (uploadedUrls.length > 0) {
        onImagesChange([...images, ...uploadedUrls]);
        toast.success(`${uploadedUrls.length} image(s) uploaded successfully`);
      }
    } catch (error: unknown) {
      console.error('Upload error:', error);
      const message = error && typeof error === 'object' && 'message' in error ? String((error as { message: string }).message) : 'Failed to upload images. Please try again.';
      toast.error(message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  /**
   * Handle URL input
   */
  const handleAddUrl = () => {
    const url = urlInput.trim();

    if (!url) return;

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    if (images.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    onImagesChange([...images, url]);
    setUrlInput('');
    toast.success('Image URL added');
  };

  /**
   * Remove image
   */
  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    toast.success('Image removed');
  };

  return (
    <div className="space-y-4">
      {/* Upload Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* File Upload (via backend → Cloudinary) */}
        <div className="space-y-2">
          <label className="block">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = e.target.files;
                handleFileUpload(files);
                e.target.value = '';
              }}
              className="hidden"
              disabled={uploading || images.length >= maxImages}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={uploading || images.length >= maxImages}
              onClick={(e) => {
                e.preventDefault();
                (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
              }}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading {uploadProgress}%
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Images
                </>
              )}
            </Button>
          </label>
          <p className="text-xs text-gray-500 text-center">
            Max 10MB per image · uploads via server
          </p>
        </div>

        {/* URL Input */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Or paste image URL"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddUrl();
                }
              }}
              disabled={images.length >= maxImages}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddUrl}
              disabled={!urlInput.trim() || images.length >= maxImages}
            >
              <LinkIcon className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 text-center">
            Press Enter to add
          </p>
        </div>
      </div>

      {/* Image Count */}
      {images.length > 0 && (
        <div className="flex items-center justify-between">
          <Badge variant="secondary">
            {images.length} / {maxImages} images
          </Badge>
          {images.length >= maxImages && (
            <p className="text-xs text-amber-600">Maximum images reached</p>
          )}
        </div>
      )}

      {/* Uploading placeholder - show while upload in progress */}
      {uploading && images.length === 0 && (
        <div className="flex items-center justify-center gap-2 p-6 rounded-lg border border-dashed border-gray-300 bg-gray-50">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-sm text-gray-600">Uploading image{uploadProgress < 100 ? `... ${uploadProgress}%` : ''}</span>
        </div>
      )}

      {/* Image Grid - preview of all images (uploaded or added via URL) */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((imageUrl, index) => (
            <div key={`${imageUrl}-${index}`} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
              <img
                src={imageUrl}
                alt={`Property ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/400x400?text=Image+Error';
                  e.currentTarget.alt = 'Failed to load image';
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveImage(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {index === 0 && (
                <Badge className="absolute top-2 left-2 bg-blue-500">
                  Primary
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State - only when not uploading */}
      {images.length === 0 && !uploading && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600 mb-2">No images added yet</p>
          <p className="text-xs text-gray-500">
            Upload images or paste URLs below to showcase your property.
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
