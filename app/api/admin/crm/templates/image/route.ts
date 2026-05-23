import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { updateCrmTemplateImage } from "@/lib/crm/templates-store";
import { getFirebaseAdminStorage } from "@/lib/firebase/admin";
import { resolveFirebaseStorageBucketCandidates } from "@/lib/firebase/storage-bucket";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_EMBEDDED_IMAGE_BYTES = 600 * 1024;

function sanitizeFileName(fileName: string): string {
  const cleaned = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return cleaned || "template-image";
}

function buildEmbeddedImageUrl(contentType: string, bytes: Buffer): string {
  return `data:${contentType};base64,${bytes.toString("base64")}`;
}

function isMissingBucketError(error: unknown): boolean {
  return error instanceof Error && error.message.toLowerCase().includes("specified bucket does not exist");
}

export async function POST(request: Request) {
  const authError = await authorizeAdminRequest();
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const templateId = formData.get("templateId");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please choose an image file." }, { status: 400 });
    }

    if (typeof templateId !== "string" || !templateId.trim()) {
      return NextResponse.json({ error: "Template id is required." }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "The selected image is empty." }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        {
          error:
            "Image file is too large. Please keep it under 5 MB."
        },
        { status: 400 }
      );
    }

    const contentType = file.type || "application/octet-stream";
    const bytes = Buffer.from(await file.arrayBuffer());
    const bucketCandidates = resolveFirebaseStorageBucketCandidates();

    if (bucketCandidates.length > 0) {
      const fileName = sanitizeFileName(file.name);
      const storagePath = `crm/templates/${templateId.trim()}/${Date.now()}-${fileName}`;
      const storage = getFirebaseAdminStorage();

      for (const bucketName of bucketCandidates) {
        try {
          const bucket = storage.bucket(bucketName);
          const [exists] = await bucket.exists();
          if (!exists) {
            continue;
          }

          const storageFile = bucket.file(storagePath);

          await storageFile.save(bytes, {
            resumable: false,
            contentType,
            metadata: {
              cacheControl: "public, max-age=31536000"
            }
          });

          const [imageUrl] = await storageFile.getSignedUrl({
            action: "read",
            expires: "2100-01-01"
          });

          const template = await updateCrmTemplateImage(templateId.trim(), {
            imageUrl,
            imageStoragePath: storagePath,
            imageStorageMode: "storage"
          });

          return NextResponse.json({
            success: true,
            template,
            storageMode: "storage"
          });
        } catch (error) {
          if (isMissingBucketError(error)) {
            continue;
          }

          throw error;
        }
      }
    }

    if (bytes.length > MAX_EMBEDDED_IMAGE_BYTES) {
      return NextResponse.json(
        {
          error:
            "Firebase Storage is not ready yet for this project. Finish the Storage setup in Firebase Console, or use an image under 600 KB as a temporary fallback."
        },
        { status: 400 }
      );
    }

    const template = await updateCrmTemplateImage(templateId.trim(), {
      imageUrl: buildEmbeddedImageUrl(contentType, bytes),
      imageStoragePath: "",
      imageStorageMode: "embedded"
    });

    return NextResponse.json({
      success: true,
      template,
      storageMode: "embedded"
    });
  } catch (error) {
    console.error("[admin][crm] Failed uploading template image", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not upload image." }, { status: 500 });
  }
}
