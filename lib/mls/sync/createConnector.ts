import { mlsSyncConfig } from "@/lib/mls/config";
import type { MLSConnectorKind } from "@/lib/mls/types";
import type { MLSFeedConnector } from "@/lib/mls/connectors/MLSFeedConnector";
import { MockMLSFeedConnector } from "@/lib/mls/connectors/MockMLSFeedConnector";
import { PlaceholderApprovedFeedConnector } from "@/lib/mls/connectors/PlaceholderApprovedFeedConnector";
import { DdfTrebFeedConnector } from "@/lib/mls/connectors/DdfTrebFeedConnector";

export function createMLSConnector(kind?: MLSConnectorKind): MLSFeedConnector {
  const resolved = kind ?? mlsSyncConfig.connectorKind;
  if (resolved === "ddf-treb") {
    return new DdfTrebFeedConnector();
  }
  if (resolved === "approved-placeholder") {
    return new PlaceholderApprovedFeedConnector(mlsSyncConfig.sourceSystem);
  }
  return new MockMLSFeedConnector();
}
