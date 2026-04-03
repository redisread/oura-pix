"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("upload");
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

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
      setError(t("singleFileOnly"));
      return [];
    }
    if (multiple && totalFiles > maxFiles) {
      setError(t("maxFilesExceeded", { max: maxFiles }));
      return [];
    }

    for (const file of fileArray) {
      // Check file size
      if (file.size > maxSize) {
        setError(t("fileTooLarge", { size: formatFileSize(maxSize) }));
        continue;
      }

      // Check file type
      if (accept !== "*" && !file.type.match(accept.replace("/*", "/"))) {
        setError(t("invalidType", { type: accept }));
        continue;
      }

      validFiles.push(file);
    }

    return validFiles;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
        const newFiles = multiple
          ? [...selectedFiles, ...validFiles]
          : validFiles;
        setSelectedFiles(newFiles);
        onFilesSelected(newFiles);
      }
    },
    [multiple, onFilesSelected, selectedFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      const validFiles = validateFiles(files);

      if (validFiles.length > 0) {
        const newFiles = multiple
          ? [...selectedFiles, ...validFiles]
          : validFiles;
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
    <div className="w-full">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center
          w-full min-h-[160px] rounded-lg border-2 border-dashed
          transition-all duration-200 cursor-pointer
          ${
            isDragOver
              ? "border-slate-900 bg-slate-50"
              : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50"
          }
          ${error ? "border-red-300 bg-red-50" : ""}
        `}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label={t("ariaUpload", { label })}
        />

        <div className="flex flex-col items-center justify-center p-6 text-center">
          {/* Upload Icon */}
          <div
            className={`
            mb-3 flex h-12 w-12 items-center justify-center rounded-full
            ${isDragOver ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}
            transition-colors duration-200
          `}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <p className="text-sm font-medium text-slate-900">
            {t("clickOrDrag")}
          </p>
          {description && (
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          )}
          <p className="mt-1 text-xs text-slate-400">
            {t("supportedFormats", { type: accept.replace("/*", ""), size: formatFileSize(maxSize) })}
            {multiple && ` (max ${maxFiles})`}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {selectedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* File Icon */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-white">
                  {file.type.startsWith("image/") ? (
                    <svg
                      className="h-4 w-4 text-slate-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-4 w-4 text-slate-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  )}
                </div>

                {/* File Info */}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                aria-label={t("ariaRemove", { filename: file.name })}
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
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
