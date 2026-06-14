import { put, del, head } from "@vercel/blob";
import { env } from "@/lib/env";

// TODO(audit): boarding passes contain passenger PII (name, booking ref).
// Replace `access: "public"` with private blobs + Vercel Blob signed URLs
// (https://vercel.com/docs/storage/vercel-blob/using-blob-sdk#download-private-files)
// before going live. Demand-letter PDFs (which also land here) contain the
// passenger's Israeli ID number; those are even more sensitive.
/** POC: stored as public-readable blobs. Replace with signed-URL access for sensitive docs in a later phase. */
export async function putPublic(key: string, body: ArrayBuffer | Buffer | Blob, contentType: string) {
  return await put(key, body, {
    access: "public",
    addRandomSuffix: false,
    contentType,
    token: env.BLOB_READ_WRITE_TOKEN,
  });
}

export async function deleteBlob(url: string) {
  await del(url, { token: env.BLOB_READ_WRITE_TOKEN });
}

export async function blobHead(url: string) {
  return await head(url, { token: env.BLOB_READ_WRITE_TOKEN });
}
