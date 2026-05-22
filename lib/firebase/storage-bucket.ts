interface FirebaseConfigShape {
  storageBucket?: unknown;
}

function sanitizeBucketName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readBucketFromFirebaseConfig(): string | null {
  const rawConfig = process.env.FIREBASE_CONFIG;
  if (!rawConfig) return null;

  try {
    const parsed = JSON.parse(rawConfig) as FirebaseConfigShape;
    return sanitizeBucketName(parsed.storageBucket);
  } catch {
    return null;
  }
}

export function resolveFirebaseStorageBucketName(): string | null {
  return (
    sanitizeBucketName(process.env.FIREBASE_STORAGE_BUCKET) ||
    sanitizeBucketName(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) ||
    readBucketFromFirebaseConfig()
  );
}
