import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { updateCrmTemplateImage } from "@/lib/crm/templates-store";
import { getFirebaseAdminStorage } from "@/lib/firebase/admin";
import { resolveFirebaseStorageBucketName } from "@/lib/firebase/storage-bucket";
import { getServerConfigValue } from "@/lib/server/secret-manager";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_EMBEDDED_IMAGE_BYTES = 250 * 1024;

function sanitizeFileName(fileName: string): string {
  const cleaned = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return cleaned || "template-image";
}

function buildEmbeddedImageUrl(contentType: string, bytes: Buffer): string {
  return `data:${contentType};base64,${bytes.toString("base64")}`;
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
      return NextResponse.json({ error: "Image file is too large. Please keep it under 4 MB." }, { status: 400 });
    }

    const contentType = file.type || "application/octet-stream";
    const bytes = Buffer.from(await file.arrayBuffer());
    await getServerConfigValue("FIREBASE_STORAGE_BUCKET");
    const bucketName = resolveFirebaseStorageBucketName();

    if (bucketName) {
      const fileName = sanitizeFileName(file.name);
      const storagePath = `crm/templates/${templateId.trim()}/${Date.now()}-${fileName}`;
      const bucket = getFirebaseAdminStorage().bucket(bucketName);
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
    }

    if (bytes.length > MAX_EMBEDDED_IMAGE_BYTES) {
      return NextResponse.json(
        {
          error: "Large image uploads need Firebase Storage configured. Images under 250 KB can still be embedded."
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
