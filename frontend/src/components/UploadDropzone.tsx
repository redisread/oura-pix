"use client";

import { useCallback, useId, useState } from "react";
import { ImageIcon, UploadCloud, X } from "lucide-react";
import * as m from "@/paraglide/messages.js";

interface UploadDropzoneProps {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in bytes
  onFilesSelected: (files: File[]) => void;
  label: string;
  description?: string;
  required?: boolean;
}

export default function UploadDropzone({
  accept = "image/*",
  multiple = false,
  maxFiles = 1,
  maxSize = 10 * 1024 * 1024, // 10MB default
  onFilesSelected,
  label,
  description,
  required = false,
}: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const validateFiles = useCallback((files: FileList | null): File[] => {
    setError(null);

    if (!files || files.length === 0) {
      return [];
    }

    const fileArray = Array.from(files);
    const validFiles: File[] = [];

    // Check max files
    const totalFiles = selectedFiles.length + fileArray.length;
    if (!multiple && fileArray.length > 1) {
      setError(m.upload_singleFileOnly());
      return [];
    }
    if (multiple && totalFiles > maxFiles) {
      setError(m.upload_maxFilesExceeded({ max: maxFiles.toString() }));
      return [];
    }

    for (const file of fileArray) {
      // Check file size
      if (file.size > maxSize) {
        setError(m.upload_fileTooLarge({ size: formatFileSize(maxSize) }));
        continue;
      }

      // Check file type
      if (accept !== "*" && !file.type.match(accept.replace("/*", "/"))) {
        setError(m.upload_invalidType({ type: accept }));
        continue;
      }

      validFiles.push(file);
    }

    return validFiles;
  }, [selectedFiles.length, multiple, maxFiles, maxSize, accept]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      const validFiles = validateFiles(files);

      if (validFiles.length > 0) {
        const newFiles = multiple ? [...selectedFiles, ...validFiles] : validFiles;
        setSelectedFiles(newFiles);
        onFilesSelected(newFiles);
      }
    },
    [multiple, onFilesSelected, selectedFiles, validateFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      const validFiles = validateFiles(files);

      if (validFiles.length > 0) {
        const newFiles = multiple ? [...selectedFiles, ...validFiles] : validFiles;
        setSelectedFiles(newFiles);
        onFilesSelected(newFiles);
      }

      // Reset input value to allow selecting the same file again
      e.target.value = "";
    },
    [multiple, onFilesSelected, selectedFiles, validateFiles]
  );

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      setSelectedFiles(newFiles);
      onFilesSelected(newFiles);
    },
    [onFilesSelected, selectedFiles]
  );

  return (
    <div className="space-y-3">
      <label htmlFor={inputId} className="block text-sm font-semibold text-foreground">
        {label}
        {required && <span className="ml-1 text-[hsl(var(--color-error))]">*</span>}
      </label>

      {/* Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative rounded-lg border-2 border-dashed p-6 text-center transition-all
          ${isDragOver
            ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)]"
            : selectedFiles.length > 0
            ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)]"
            : "border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--foreground)/0.28)]"
          }
        `}
      >
        <input
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />

        <div className="pointer-events-none">
          <UploadCloud
            className={`mx-auto h-10 w-10 ${selectedFiles.length > 0 ? "text-[hsl(var(--primary))]" : "text-foreground-muted"}`}
            aria-hidden="true"
          />
          <p className="mt-2 text-sm font-medium text-foreground">
            {selectedFiles.length > 0
              ? m.upload_filesSelected({ count: selectedFiles.length.toString() })
              : m.upload_clickOrDrag()}
          </p>
          <p className="mt-1 text-xs text-foreground-muted">
            {description || m.upload_supportedFormats({ type: accept, size: formatFileSize(maxSize) })}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm font-medium text-[hsl(var(--color-error))]">{error}</p>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          {selectedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background-secondary)/0.55)] px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <ImageIcon className="h-5 w-5 shrink-0 text-[hsl(var(--primary))]" aria-hidden="true" />
                <span className="truncate text-sm text-foreground">{file.name}</span>
                <span className="shrink-0 text-xs text-foreground-muted">
                  ({formatFileSize(file.size)})
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="ml-2 shrink-0 rounded-md p-1 text-foreground-muted transition-colors hover:bg-[hsl(var(--color-error-light))] hover:text-[hsl(var(--color-error))]"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
