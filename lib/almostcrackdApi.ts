const BASE_URL = "https://api.almostcrackd.ai";

export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
] as const;

export function isSupportedImageType(type: string): boolean {
  return SUPPORTED_IMAGE_TYPES.includes(
    type as (typeof SUPPORTED_IMAGE_TYPES)[number]
  );
}

export type CaptionResult = {
  imageId: string;
  cdnUrl?: string;
  captions: unknown[];
};

async function getPresignedUrl(
  accessToken: string,
  contentType: string
): Promise<{ presignedUrl: string; cdnUrl: string }> {
  const res = await fetch(`${BASE_URL}/pipeline/generate-presigned-url`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ contentType }),
  });
  if (!res.ok) {
    throw new Error(
      `Presigned URL failed (${res.status}): ${await res.text()}`
    );
  }
  return res.json();
}

async function putToPresignedUrl(
  presignedUrl: string,
  file: File
): Promise<void> {
  const res = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status}): ${await res.text()}`);
  }
}

async function registerImageFromUrl(
  accessToken: string,
  imageUrl: string
): Promise<string> {
  const res = await fetch(`${BASE_URL}/pipeline/upload-image-from-url`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageUrl, isCommonUse: false }),
  });
  if (!res.ok) {
    throw new Error(
      `Register image failed (${res.status}): ${await res.text()}`
    );
  }
  const data = (await res.json()) as { imageId: string };
  return data.imageId;
}

async function callGenerateCaptions(
  accessToken: string,
  imageId: string,
  humorFlavorId: number | string | null
): Promise<unknown[]> {
  const body: Record<string, unknown> = { imageId };
  if (humorFlavorId != null && humorFlavorId !== "") {
    body.humorFlavorId = Number(humorFlavorId);
  }
  const res = await fetch(`${BASE_URL}/pipeline/generate-captions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(
      `Generate captions failed (${res.status}): ${await res.text()}`
    );
  }
  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("Caption response was not an array");
  }
  return data;
}

export async function generateCaptionsForImageId(
  accessToken: string,
  imageId: string,
  humorFlavorId: number | string | null
): Promise<CaptionResult> {
  const captions = await callGenerateCaptions(
    accessToken,
    imageId,
    humorFlavorId
  );
  return { imageId, captions };
}

export async function uploadAndGenerateCaptions(
  accessToken: string,
  file: File,
  humorFlavorId: number | string | null
): Promise<CaptionResult> {
  if (!isSupportedImageType(file.type)) {
    throw new Error(
      `Unsupported image type: ${file.type}. Allowed: ${SUPPORTED_IMAGE_TYPES.join(", ")}`
    );
  }
  const { presignedUrl, cdnUrl } = await getPresignedUrl(
    accessToken,
    file.type
  );
  await putToPresignedUrl(presignedUrl, file);
  const imageId = await registerImageFromUrl(accessToken, cdnUrl);
  const captions = await callGenerateCaptions(
    accessToken,
    imageId,
    humorFlavorId
  );
  return { imageId, cdnUrl, captions };
}
