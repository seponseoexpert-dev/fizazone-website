import { useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { uploadSiteImage } from "@/lib/uploads";

type Props = {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  folder?: string;
};

/** Drag & drop / click-to-browse image upload with an optional URL paste field. */
export function ImageUploader({ value, onChange, label = "Image", folder = "content" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [showUrl, setShowUrl] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadSiteImage(file, folder));
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sm:col-span-2">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <button
          type="button"
          onClick={() => setShowUrl((s) => !s)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <Link2 className="h-3.5 w-3.5" /> {showUrl ? "Hide URL" : "Use URL"}
        </button>
      </div>

      {value ? (
        <div className="relative overflow-hidden rounded-lg border border-border">
          <img src={value} alt="" className="h-36 w-full object-cover sm:h-44" />
          <div className="absolute right-2 top-2 flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="grid h-8 w-8 place-items-center rounded-full bg-background/90 text-foreground"
              aria-label="Replace image"
            >
              <ImagePlus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="grid h-8 w-8 place-items-center rounded-full bg-background/90 text-destructive"
              aria-label="Remove image"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            void handleFile(e.dataTransfer.files?.[0]);
          }}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-7 text-center transition ${
            over ? "border-sale bg-sale/5" : "border-border bg-secondary/40 hover:bg-secondary"
          }`}
        >
          {busy ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <UploadCloud className="h-6 w-6 text-muted-foreground" />
          )}
          <span className="text-sm font-semibold">Drag & drop an image here</span>
          <span className="text-xs text-muted-foreground">or click to browse · PNG, JPG up to 10MB</span>
        </button>
      )}

      {showUrl && (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-sale"
        />
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          void handleFile(file);
        }}
      />
    </div>
  );
}
