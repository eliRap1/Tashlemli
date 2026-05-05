import { put, del, head } from "@vercel/blob";
import { env } from "@/lib/env";

export async function putPrivate(key: string, body: ArrayBuffer | Buffer | Blob, contentType: string) {
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
