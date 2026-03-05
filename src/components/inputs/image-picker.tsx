"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Trash, Upload } from "lucide-react";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";

function isImageFile(file: File): boolean {
  return (
    file.type.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(file.name)
  );
}

function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file || !isImageFile(file)) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url;
}

type ImagePickerProps = {
  value: File | null;
  onChange: (file: File | null) => void;
  label?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
};

export function ImagePicker({
  value,
  onChange,
  label,
  description,
  className,
  disabled,
}: ImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasFile = value instanceof File;
  const objectUrl = useObjectUrl(hasFile ? value : null);
  const previewUrl = objectUrl ?? null;

  const triggerFileInput = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium">{label}</Label>
      )}
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={disabled}
          aria-label={label ?? "Choose image file"}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onChange(file);
            e.target.value = "";
          }}
        />
        {previewUrl ? (
          <div className="bg-muted flex items-center gap-3 rounded-lg border p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={hasFile ? value.name : "Preview"}
              className="h-16 w-16 shrink-0 rounded-md object-cover"
            />
            <div className="min-w-0 flex-1">
              {hasFile && (
                <p className="truncate text-sm font-medium">{value.name}</p>
              )}
              <p className="text-muted-foreground text-xs">
                {hasFile
                  ? "New image selected. Upload on submit."
                  : "Existing image."}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              aria-label="Remove image"
              className="text-muted-foreground hover:text-destructive shrink-0"
              onClick={() => {
                onChange(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={triggerFileInput}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          {previewUrl ? "Replace image" : "Choose image"}
        </Button>
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              triggerFileInput();
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (disabled) return;
            const file = e.dataTransfer.files?.[0];
            if (file && isImageFile(file)) onChange(file);
          }}
          onDragOver={(e) => e.preventDefault()}
            className={cn(
              "rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 text-center text-sm transition-colors",
              "hover:border-muted-foreground/50 hover:bg-muted/50",
              disabled && "pointer-events-none opacity-50",
            )}
          onClick={triggerFileInput}
        >
          Drag and drop an image here, or click to browse
        </div>
      </div>
      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
    </div>
  );
}
