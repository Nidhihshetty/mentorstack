"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Camera, Upload, X, Loader2 } from 'lucide-react';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onUploadSuccess?: (newAvatarUrl: string) => void;
  onDeleteSuccess?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  editable?: boolean;
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
  xl: 'w-40 h-40'
};

const iconSizes = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28
};

export default function AvatarUpload({
  currentAvatarUrl,
  onUploadSuccess,
  onDeleteSuccess,
  size = 'lg',
  editable = true
}: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update avatar when prop changes
  useEffect(() => {
    setAvatarUrl(currentAvatarUrl || null);
  }, [currentAvatarUrl]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload the file
    uploadAvatar(file);
  };

  const uploadAvatar = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/upload/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload failed response:', errorData);
        throw new Error(errorData.error || errorData.details || 'Upload failed');
      }

      const data = await response.json();
      setAvatarUrl(data.avatarUrl);
      setPreviewUrl(null);
      
      if (onUploadSuccess) {
        onUploadSuccess(data.avatarUrl);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!avatarUrl) return;

    const confirmed = window.confirm('Are you sure you want to delete your avatar?');
    if (!confirmed) return;

    setIsDeleting(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/upload/avatar`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Delete failed');
      }

      setAvatarUrl(null);
      
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete avatar');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClick = () => {
    if (editable && !isUploading && !isDeleting) {
      fileInputRef.current?.click();
    }
  };

  const displayUrl = previewUrl || avatarUrl;
  const isProcessing = isUploading || isDeleting;

  return (
    <div className="flex flex-col items-center justify-center mt-10 gap-8">
      {/* Avatar Container */}
      <div
        className="relative group"
        onMouseEnter={() => editable && setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Avatar Circle */}
        <div
          className={`${sizeClasses[size]} rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 relative ${
            editable && !isProcessing ? 'cursor-pointer' : ''
          }`}
          onClick={handleClick}
        >
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt="Avatar"
              fill
              className={`object-cover ${isProcessing ? 'opacity-50' : ''}`}
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 text-white text-3xl font-bold">
              {/* Placeholder with first letter */}
              <span className="uppercase"></span>
            </div>
          )}

          {/* Loading Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <Loader2 className="animate-spin text-white" size={iconSizes[size]} />
            </div>
          )}

          {/* Hover Overlay */}
          {editable && !isProcessing && showActions && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 transition-opacity">
              <Camera className="text-white" size={iconSizes[size]} />
            </div>
          )}
        </div>

        {/* Delete Button */}
        {editable && avatarUrl && !isProcessing && showActions && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors"
            title="Delete avatar"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Upload Button (Alternative to click)
      {editable && !isProcessing && (
        <button
          onClick={handleClick}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Upload size={16} />
          {avatarUrl ? 'Change Avatar' : 'Upload Avatar'}
        </button>
      )} */}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isProcessing}
      />

      {/* Error Message */}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Upload Info */}
      {editable && !error && (
        <p className="text-xs text-gray-400 text-center max-w-xs">
          {isUploading
            ? 'Uploading...'
            : isDeleting
            ? 'Deleting...'
            : 'JPG, PNG, GIF or WEBP. Max size 5MB. Best results with square images.'}
        </p>
      )}
    </div>
  );
}
