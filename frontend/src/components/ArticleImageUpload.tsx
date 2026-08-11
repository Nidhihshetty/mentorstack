"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Upload, X, ImageIcon } from "lucide-react";

interface ArticleImageUploadProps {
  onImagesChange: (images: File[]) => void;
  onExistingImagesChange?: (urls: string[]) => void;
  maxImages?: number;
  initialImages?: string[];
}

export default function ArticleImageUpload({
  onImagesChange,
  onExistingImagesChange,
  maxImages = 5,
  initialImages = [],
}: ArticleImageUploadProps) {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(initialImages);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

  // Update existing images when initialImages prop changes
  useEffect(() => {
    setExistingImages(initialImages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialImages)]);

  const getTotalImageCount = () => {
    return existingImages.length + images.length;
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `${file.name}: Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File size exceeds 10MB limit.`;
    }
    return null;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);
    const newFiles = Array.from(files);

    // Check total count (existing + current + new)
    const totalCount = getTotalImageCount();
    if (totalCount + newFiles.length > maxImages) {
      setError(`You can only upload up to ${maxImages} images in total.`);
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of newFiles) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    const updatedImages = [...images, ...validFiles];
    const updatedPreviews = [...previews, ...newPreviews];

    setImages(updatedImages);
    setPreviews(updatedPreviews);
    onImagesChange(updatedImages);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeNewImage = (index: number) => {
    // Revoke object URL to prevent memory leak
    if (previews[index] && previews[index].startsWith("blob:")) {
      URL.revokeObjectURL(previews[index]);
    }

    const updatedImages = images.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);

    setImages(updatedImages);
    setPreviews(updatedPreviews);
    onImagesChange(updatedImages);
    setError(null);
  };

  const removeExistingImage = (index: number) => {
    const updatedExisting = existingImages.filter((_, i) => i !== index);
    setExistingImages(updatedExisting);
    if (onExistingImagesChange) {
      onExistingImagesChange(updatedExisting);
    }
    setError(null);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-[#06a395] bg-[#d1fae5]"
            : "border-[#a8e4c9] bg-[#e6fcf1] hover:border-[#06a395] hover:bg-[#d1fae5]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={images.length >= maxImages}
          aria-label="Upload images"
        />

        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-[#a8e4c9] flex items-center justify-center">
            <Upload className="w-8 h-8 text-[#065f46]" />
          </div>
          
          <div>
            <p className="text-[#172A3A] font-medium mb-1">
              {getTotalImageCount() >= maxImages
                ? `Maximum ${maxImages} images reached`
                : "Click to upload or drag and drop"}
            </p>
            <p className="text-sm text-[#3d4e5c]">
              JPEG, PNG, GIF, WebP up to 10MB each
            </p>
            <p className="text-xs text-[#3d4e5c] mt-1">
              {getTotalImageCount()}/{maxImages} images total
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
          <svg
            className="w-5 h-5 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Image Previews Grid */}
      {(existingImages.length > 0 || previews.length > 0) && (
        <div>
          <h4 className="text-sm font-medium text-[#172A3A] mb-3 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Images ({getTotalImageCount()})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Existing Images */}
            {existingImages.map((imageUrl, index) => (
              <div
                key={`existing-${index}`}
                className="relative group aspect-square rounded-lg overflow-hidden border-2 border-[#a8e4c9] hover:border-[#06a395] transition-colors"
              >
                <Image
                  src={imageUrl}
                  alt={`Existing image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
                
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeExistingImage(index);
                  }}
                  title="Remove image"
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Image Number & Badge */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1">
                  <div className="bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                    #{index + 1}
                  </div>
                  <div className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                    Saved
                  </div>
                </div>
              </div>
            ))}

            {/* New Images */}
            {previews.map((preview, index) => (
              <div
                key={`new-${index}`}
                className="relative group aspect-square rounded-lg overflow-hidden border-2 border-[#a8e4c9] hover:border-[#06a395] transition-colors"
              >
                <Image
                  src={preview}
                  alt={`New image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
                
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNewImage(index);
                  }}
                  title="Remove image"
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Image Number & Badge */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1">
                  <div className="bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                    #{existingImages.length + index + 1}
                  </div>
                  <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    New
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Helper Text */}
      {getTotalImageCount() > 0 && getTotalImageCount() < maxImages && (
        <p className="text-xs text-[#3d4e5c] text-center">
          You can add {maxImages - getTotalImageCount()} more image{maxImages - getTotalImageCount() !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
