"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { useI18n } from "@/components/i18n/I18nProvider";

export interface InspirationImage {
  name: string;
  type: string;
  size: number;
  previewUrl: string;
}

interface InspirationUploadProps {
  value: InspirationImage | null;
  onChange: (image: InspirationImage | null) => void;
  disabled?: boolean;
  maxBytes?: number;
}

const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export function InspirationUpload({
  value,
  onChange,
  disabled = false,
  maxBytes = 5 * 1024 * 1024,
}: InspirationUploadProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File | undefined) => {
      setError(null);
      if (!file) return;
      if (!ACCEPTED.includes(file.type)) {
        setError(t("globalDemand.uploadErrorType"));
        return;
      }
      if (file.size > maxBytes) {
        setError(t("globalDemand.uploadErrorSize"));
        return;
      }
      if (value?.previewUrl) URL.revokeObjectURL(value.previewUrl);
      const previewUrl = URL.createObjectURL(file);
      onChange({
        name: file.name,
        type: file.type,
        size: file.size,
        previewUrl,
      });
    },
    [maxBytes, onChange, t, value],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      handleFile(e.dataTransfer.files?.[0]);
    },
    [disabled, handleFile],
  );

  const remove = () => {
    if (value?.previewUrl) URL.revokeObjectURL(value.previewUrl);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <section className="flex flex-col gap-5">
      <SectionLabel>{t("globalDemand.uploadLabel")}</SectionLabel>

      <label
        htmlFor="inspiration-upload"
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`glass-panel group relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-[var(--radius-lg)] p-6 text-center transition-all duration-300 ${isDragging ? "border-[var(--color-line-strong)] bg-white/[0.03]" : ""
          } ${disabled ? "cursor-not-allowed opacity-50" : "hover:border-[var(--color-line-strong)]"}`}
      >
        <input
          ref={inputRef}
          id="inspiration-upload"
          type="file"
          accept={ACCEPTED.join(",")}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {value ? (
          <div className="flex w-full items-center gap-5">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-line)]">
              <Image
                src={value.previewUrl}
                alt={value.name}
                fill
                sizes="80px"
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="flex-1 text-left">
              <div className="truncate text-[13px] text-[var(--color-ivory)]">
                {value.name}
              </div>
              <div className="mt-1 text-[11px] tracking-[0.06em] text-[var(--color-silver-500)] uppercase">
                {(value.size / 1024).toFixed(0)} {t("globalDemand.uploadPreviewNote")}
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                remove();
              }}
              className="rounded-full border border-[var(--color-line)] p-2 text-[var(--color-silver-300)] transition-colors hover:border-[var(--color-line-strong)] hover:text-[var(--color-ivory)]"
              aria-label={t("globalDemand.uploadRemoveAria")}
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-[var(--color-silver-400)]">
            <ImagePlus className="h-6 w-6" strokeWidth={1.2} />
            <div className="font-editorial text-[18px] text-[var(--color-silver-200)]">
              {t("globalDemand.uploadDropTitle")}
            </div>
            <div className="text-[11px] tracking-[0.14em] text-[var(--color-silver-500)] uppercase">
              {t("globalDemand.uploadDropHint")}
            </div>
          </div>
        )}
      </label>

      {error && (
        <p role="alert" className="text-[12px] text-red-400/90">
          {error}
        </p>
      )}
    </section>
  );
}
