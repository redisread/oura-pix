"use client";

import { useCallback, useState } from "react";
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const validateFiles = (files: FileList | null): File[] => {
    setError(null);

    if (!files || files.length === 0) {
      return [];
    }

    const fileArray = Array.from(files);
    const validFiles: File[] = [];

    // Check max files
    const totalFiles = selectedFiles.length + fileArray.length;
    if (!multiple && fileArray.length > 1) {
      setError(m.upload_singleFileOnly?.() || "只能上传单个文件");
      return [];
    }
    if (multiple && totalFiles > maxFiles) {
      setError(m.upload_maxFilesExceeded?.({ max: maxFiles.toString() }) || `最多上传 ${maxFiles} 个文件`);
      return [];
    }

    for (const file of fileArray) {
      // Check file size
      if (file.size > maxSize) {
        setError(m.upload_fileTooLarge?.({ size: formatFileSize(maxSize) }) || `文件大小不能超过 ${formatFileSize(maxSize)}`);
        continue;
      }

      // Check file type
      if (accept !== "*" && !file.type.match(accept.replace("/*", "/"))) {
        setError(m.upload_invalidType?.({ type: accept }) || `不支持的文件类型`);
        continue;
      }

      validFiles.push(file);
    }

    return validFiles;
  };

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
    [multiple, onFilesSelected, selectedFiles]
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
    [multiple, onFilesSelected, selectedFiles]
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
      <label className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {/* Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative rounded-lg border-2 border-dashed p-6 text-center transition-all
          ${isDragOver
            ? "border-slate-900 bg-slate-50"
            : selectedFiles.length > 0
            ? "border-slate-900 bg-slate-50"
            : "border-slate-300 hover:border-slate-400"
          }
        `}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />

        <div className="pointer-events-none">
          <svg
            className={`mx-auto h-10 w-10 ${selectedFiles.length > 0 ? "text-slate-900" : "text-slate-400"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="mt-2 text-sm text-slate-600">
            {selectedFiles.length > 0
              ? m.upload_filesSelected?.({ count: selectedFiles.length.toString() }) || `已选择 ${selectedFiles.length} 个文件`
              : m.upload_clickOrDrag?.() || "点击或拖拽文件到此处上传"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {description || m.upload_supportedFormats?.() || "支持 JPG、PNG、WebP 格式"}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          {selectedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <svg
                  className="h-5 w-5 shrink-0 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm text-slate-700 truncate">{file.name}</span>
                <span className="text-xs text-slate-500 shrink-0">
                  ({formatFileSize(file.size)})
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="ml-2 shrink-0 text-slate-400 hover:text-red-500 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
