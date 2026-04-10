import { ALLOWED_MUNICIPALITIES, ALLOWED_PROPERTY_CLASSES, DISPLAYABLE_STATUSES } from "@/lib/firebase-sync/settings";
import type {
  AllowedMunicipality,
  HiddenReason,
  ListingStatus,
  NormalizedListing,
  PropertyClass
} from "@/types/firebase-sync";

export function isAllowedPropertyClass(value: string | null): value is PropertyClass {
  if (!value) return false;
  return ALLOWED_PROPERTY_CLASSES.includes(value as PropertyClass);
}

export function isAllowedMunicipality(value: string | null): value is AllowedMunicipality {
  if (!value) return false;
  return ALLOWED_MUNICIPALITIES.includes(value as AllowedMunicipality);
}

export function isDisplayableStatus(status: ListingStatus): boolean {
  return DISPLAYABLE_STATUSES.includes(status);
}

export function hasRequiredPublicFields(listing: NormalizedListing): boolean {
  return Boolean(
    listing.listingId &&
      listing.mlsNumber &&
      listing.municipality &&
      listing.propertyClass &&
      listing.price != null &&
      listing.address.fullAddress &&
      listing.publicRemarks
  );
}

export function computeVisibility(listing: NormalizedListing): { isVisible: boolean; hiddenReason: HiddenReason | null } {
  if (!listing.permToAdvertise) {
    return { isVisible: false, hiddenReason: "perm_to_advertise_false" };
  }

  if (!isAllowedPropertyClass(listing.propertyClass)) {
    return { isVisible: false, hiddenReason: "unsupported_property_class" };
  }

  if (!isAllowedMunicipality(listing.municipality)) {
    return { isVisible: false, hiddenReason: "unsupported_municipality" };
  }

  if (!isDisplayableStatus(listing.status)) {
    return { isVisible: false, hiddenReason: "status_not_displayable" };
  }

  if (!hasRequiredPublicFields(listing)) {
    return { isVisible: false, hiddenReason: "missing_required_public_fields" };
  }

  return { isVisible: true, hiddenReason: null };
}
