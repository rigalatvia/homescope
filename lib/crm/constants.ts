import type { CrmTemplateRecord } from "@/types/crm";

const now = "2026-01-01T00:00:00.000Z";

export const CRM_TEMPLATE_DEFAULTS: CrmTemplateRecord[] = [
  {
    id: "birthday",
    kind: "birthday",
    name: "Birthday Card",
    subject: "Happy Birthday from Yan",
    previewText: "Wishing you a beautiful birthday and a wonderful year ahead.",
    headline: "Happy Birthday!",
    body:
      "Wishing you a beautiful day filled with joy, health, and happy moments. May the year ahead bring you comfort, success, and many reasons to smile.",
    signature: "Warm wishes,\nYan Ginzburg",
    imageUrl: "",
    imageStoragePath: "",
    imageStorageMode: "none",
    enabled: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "new-year",
    kind: "holiday",
    name: "New Year",
    subject: "Happy New Year from Yan",
    previewText: "Wishing you peace, health, and new beginnings for the year ahead.",
    headline: "Happy New Year!",
    body:
      "Wishing you and your family a joyful New Year filled with peace, good health, and exciting new opportunities. Thank you for being part of my community.",
    signature: "With appreciation,\nYan Ginzburg",
    imageUrl: "",
    imageStoragePath: "",
    imageStorageMode: "none",
    enabled: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "family-day",
    kind: "holiday",
    name: "Family Day",
    subject: "Happy Family Day from Yan",
    previewText: "Wishing you a warm and relaxing Family Day.",
    headline: "Happy Family Day!",
    body:
      "Wishing you a cozy and meaningful Family Day surrounded by the people who matter most. I hope the day brings rest, connection, and happy memories.",
    signature: "Warmly,\nYan Ginzburg",
    imageUrl: "",
    imageStoragePath: "",
    imageStorageMode: "none",
    enabled: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "victoria-day",
    kind: "holiday",
    name: "Victoria Day",
    subject: "Happy Victoria Day from Yan",
    previewText: "Wishing you a bright and relaxing long weekend.",
    headline: "Happy Victoria Day!",
    body:
      "Wishing you a joyful Victoria Day and a peaceful long weekend. I hope you have time to relax, celebrate, and enjoy the start of the summer season.",
    signature: "Best wishes,\nYan Ginzburg",
    imageUrl: "",
    imageStoragePath: "",
    imageStorageMode: "none",
    enabled: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "canada-day",
    kind: "holiday",
    name: "Canada Day",
    subject: "Happy Canada Day from Yan",
    previewText: "Celebrating Canada with gratitude and warm wishes.",
    headline: "Happy Canada Day!",
    body:
      "Wishing you a wonderful Canada Day filled with celebration, gratitude, and time with the people you care about. Enjoy the holiday and everything this beautiful country offers.",
    signature: "Sincerely,\nYan Ginzburg",
    imageUrl: "",
    imageStoragePath: "",
    imageStorageMode: "none",
    enabled: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "labour-day",
    kind: "holiday",
    name: "Labour Day",
    subject: "Happy Labour Day from Yan",
    previewText: "Wishing you a restful and well-deserved holiday.",
    headline: "Happy Labour Day!",
    body:
      "Wishing you a relaxing Labour Day and a well-deserved break. I hope you enjoy the long weekend and head into the new season feeling refreshed and inspired.",
    signature: "All the best,\nYan Ginzburg",
    imageUrl: "",
    imageStoragePath: "",
    imageStorageMode: "none",
    enabled: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "thanksgiving",
    kind: "holiday",
    name: "Thanksgiving",
    subject: "Happy Thanksgiving from Yan",
    previewText: "Sending gratitude and warm wishes this Thanksgiving.",
    headline: "Happy Thanksgiving!",
    body:
      "Wishing you a warm and joyful Thanksgiving filled with gratitude, comfort, and good company. I hope the season brings peace to your home and happiness to your family.",
    signature: "With gratitude,\nYan Ginzburg",
    imageUrl: "",
    imageStoragePath: "",
    imageStorageMode: "none",
    enabled: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "christmas",
    kind: "holiday",
    name: "Christmas",
    subject: "Merry Christmas from Yan",
    previewText: "Wishing you peace, joy, and warmth this Christmas season.",
    headline: "Merry Christmas!",
    body:
      "Wishing you and your loved ones a Merry Christmas filled with warmth, joy, and peaceful moments. May the holiday season bring comfort to your home and hope for the year ahead.",
    signature: "Warmest wishes,\nYan Ginzburg",
    imageUrl: "",
    imageStoragePath: "",
    imageStorageMode: "none",
    enabled: true,
    createdAt: now,
    updatedAt: now
  }
];

export function getDefaultCrmTemplateMap(): Map<string, CrmTemplateRecord> {
  return new Map(CRM_TEMPLATE_DEFAULTS.map((template) => [template.id, template]));
}
