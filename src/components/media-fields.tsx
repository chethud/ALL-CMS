"use client";

import { useState } from "react";
import { removeCmsImage, uploadCmsImage } from "@/app/actions";
import { fileLabel, resolveMediaUrl } from "@/lib/media";

async function uploadImage(siteId: string, folder: string, file: File) {
  const body = new FormData();
  body.set("file", file);
  const result = await uploadCmsImage(siteId, folder, body);
  if ("error" in result) throw new Error(result.error);
  return result.url;
}

async function removeStored(siteId: string, url: string) {
  await removeCmsImage(siteId, url);
}

export function SingleImageField({
  label,
  hint,
  url,
  domain,
  siteId,
  folder,
  onChange,
  onBusy,
}: {
  label: string;
  hint?: string;
  url: string;
  domain: string;
  siteId: string;
  folder: string;
  onChange: (url: string) => void;
  onBusy: (delta: number) => void;
}) {
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const preview = resolveMediaUrl(url, domain);

  return (
    <div className="grid gap-2">
      <div>
        <p className="text-sm font-medium text-[#16324F]">{label}</p>
        {hint ? <p className="text-xs leading-5 text-[#5C6B7A]">{hint}</p> : null}
      </div>
      {url ? (
        <figure className="overflow-hidden rounded-xl border border-[#E4E9ED] bg-[#F7F9FA]">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-44 w-full object-cover" />
          ) : null}
          <figcaption className="grid gap-1 px-3 py-2 text-xs text-[#5C6B7A]">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate">{fileLabel(url)}</span>
            <button
              type="button"
              className="btn btn-danger h-8 px-2"
              onClick={() => {
                void removeStored(siteId, url);
                onChange("");
              }}
            >
                Remove
              </button>
            </div>
            <p className="break-all">{url}</p>
            {preview && preview !== url ? <p className="break-all">{preview}</p> : null}
          </figcaption>
        </figure>
      ) : (
        <p className="rounded-xl border border-dashed border-[#D5DEE6] px-3 py-6 text-sm text-[#5C6B7A]">No image yet.</p>
      )}
      <label className="btn btn-secondary w-fit cursor-pointer">
        {uploading ? "Uploading…" : url ? "Replace image" : "Upload image"}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            setError("");
            setUploading(true);
            onBusy(1);
            void uploadImage(siteId, folder, file)
              .then(async (nextUrl) => {
                if (url) await removeStored(siteId, url);
                onChange(nextUrl);
              })
              .catch((uploadError: Error) => setError(uploadError.message))
              .finally(() => {
                setUploading(false);
                onBusy(-1);
              });
          }}
        />
      </label>
      {error ? <p className="text-sm text-[#9F2D2D]">{error}</p> : null}
    </div>
  );
}

export function GalleryField({
  urls,
  domain,
  siteId,
  folder,
  onChange,
  onBusy,
}: {
  urls: string[];
  domain: string;
  siteId: string;
  folder: string;
  onChange: (urls: string[]) => void;
  onBusy: (delta: number) => void;
}) {
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  return (
    <div className="grid gap-3">
      <div>
        <p className="text-sm font-medium text-[#16324F]">Gallery</p>
        <p className="text-xs leading-5 text-[#5C6B7A]">Current images for this layout. New files are stored in this site’s folder.</p>
      </div>
      {urls.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#D5DEE6] px-3 py-6 text-sm text-[#5C6B7A]">No gallery images yet.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {urls.map((url) => (
            <li key={url} className="overflow-hidden rounded-xl border border-[#E4E9ED] bg-[#F7F9FA]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resolveMediaUrl(url, domain)} alt="" className="h-36 w-full object-cover" />
              <div className="grid gap-1 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-[#5C6B7A]">{fileLabel(url)}</span>
                  <button
                    type="button"
                    className="btn btn-danger h-8 px-2"
                    onClick={() => {
                      void removeStored(siteId, url);
                      onChange(urls.filter((item) => item !== url));
                    }}
                  >
                    Remove
                  </button>
                </div>
                <p className="break-all text-xs text-[#5C6B7A]">{url}</p>
                {resolveMediaUrl(url, domain) !== url ? (
                  <p className="break-all text-xs text-[#0077A8]">{resolveMediaUrl(url, domain)}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      <label className="btn btn-secondary w-fit cursor-pointer">
        {uploading ? "Uploading…" : "Add images"}
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          disabled={uploading}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            if (files.length === 0) return;
            setError("");
            setUploading(true);
            onBusy(1);
            void (async () => {
              const added: string[] = [];
              try {
                for (const file of files) {
                  added.push(await uploadImage(siteId, folder, file));
                }
              } catch (uploadError) {
                setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
              }
              if (added.length > 0) onChange([...urls, ...added]);
            })().finally(() => {
              setUploading(false);
              onBusy(-1);
            });
          }}
        />
      </label>
      {error ? <p className="text-sm text-[#9F2D2D]">{error}</p> : null}
    </div>
  );
}
