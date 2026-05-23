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

function buildRelatedBucketCandidate(bucketName: string): string | null {
  if (bucketName.endsWith(".firebasestorage.app")) {
    return bucketName.replace(/\.firebasestorage\.app$/, ".appspot.com");
  }

  if (bucketName.endsWith(".appspot.com")) {
    return bucketName.replace(/\.appspot\.com$/, ".firebasestorage.app");
  }

  return null;
}

export function resolveFirebaseStorageBucketName(): string | null {
  return resolveFirebaseStorageBucketCandidates()[0] ?? null;
}

export function resolveFirebaseStorageBucketCandidates(): string[] {
  const configured = [
    sanitizeBucketName(process.env.FIREBASE_STORAGE_BUCKET),
    sanitizeBucketName(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
    readBucketFromFirebaseConfig()
  ].filter((value): value is string => Boolean(value));

  const related = configured
    .map((bucketName) => buildRelatedBucketCandidate(bucketName))
    .filter((value): value is string => Boolean(value));

  return Array.from(new Set([...configured, ...related]));
}
