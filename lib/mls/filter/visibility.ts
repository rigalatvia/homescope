import { allowedDisplayStatuses, allowedMunicipalities, allowedPropertyClasses } from "@/lib/mls/config";
import type {
  MLSHiddenReason,
  MLSListingStatus,
  MLSMunicipality,
  MLSPropertyClass,
  NormalizedMLSListing
} from "@/lib/mls/types";

export function isAllowedPropertyClass(value: string | null): value is MLSPropertyClass {
  if (!value) return false;
  return allowedPropertyClasses.includes(value as MLSPropertyClass);
}

export function isAllowedMunicipality(value: string | null): value is MLSMunicipality {
  if (!value) return false;
  return allowedMunicipalities.includes(value as MLSMunicipality);
}

export function isPermittedToAdvertise(value: boolean): boolean {
  return value === true;
}

export function isDisplayableStatus(status: MLSListingStatus): boolean {
  return (allowedDisplayStatuses as readonly string[]).includes(status);
}

export function hasMinimumPublicFields(listing: NormalizedMLSListing): boolean {
  return Boolean(
    listing.listingId &&
      listing.mlsNumber &&
      listing.municipality &&
      listing.propertyClass &&
      listing.address.fullAddress &&
      listing.price != null &&
      listing.publicRemarks
  );
}

export function computeVisibility(listing: NormalizedMLSListing): {
  isVisible: boolean;
  hiddenReason: MLSHiddenReason | null;
} {
  if (!isAllowedPropertyClass(listing.propertyClass)) {
    return { isVisible: false, hiddenReason: "unsupported_property_class" };
  }
  if (!isAllowedMunicipality(listing.municipality)) {
    return { isVisible: false, hiddenReason: "unsupported_municipality" };
  }
  if (!isDisplayableStatus(listing.status)) {
    return { isVisible: false, hiddenReason: "status_not_displayable" };
  }
  if (!hasMinimumPublicFields(listing)) {
    return { isVisible: false, hiddenReason: "missing_required_public_fields" };
  }
  return { isVisible: true, hiddenReason: null };
}
