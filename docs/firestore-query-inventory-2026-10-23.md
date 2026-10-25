# Firestore operation call-site inventory

Static inventory generated October 23, 2026. Includes terminal SDK calls and transaction/batch entry points; builders and indirect wrappers are discussed in the audit report. Nested transaction calls are not additional independently triggered requests. This is a review index, not measured traffic; dynamic paths require the collection constants in each source. Placeholder/mock modules must not be counted as deployed traffic.

| File:line | Enclosing function | Operation | Source expression |
|---|---|---|---|
| app/admin/leads/page.tsx:42 | updateShowingStatus | get | `docRef.get()` |
| app/admin/leads/page.tsx:56 | updateShowingStatus | set | `docRef.set( { status: nextStatus, actualShowingDateTime: actualShowingDateTime &#124;&#124; null, statusUpdatedAt: new Date().toISOString() }, { merge: true } )` |
| app/api/admin/featured/route.ts:79 | getListingOptionsByIds | get | `firestore.collection(LISTINGS_COLLECTION).where("listingId", "in", chunk).get()` |
| app/api/admin/featured/route.ts:102 | getListingOptionsByAgentKeys | get | `firestore.collection(LISTINGS_COLLECTION).where("listAgentKey", "==", agentKey).get()` |
| app/api/admin/featured/route.ts:103 | getListingOptionsByAgentKeys | get | `firestore.collection(LISTINGS_COLLECTION).where("listAgentNationalAssociationId", "==", agentKey).get()` |
| app/api/admin/featured/route.ts:122 | getTopListingOptions | get | `firestore .collection(LISTINGS_COLLECTION) .where("isVisible", "==", true) .orderBy("price", "desc") .limit(250) .get()` |
| app/api/admin/featured/route.ts:193 | resolveFeaturedMlsNumbers | get | `firestore .collection(LISTINGS_COLLECTION) .where("mlsNumber", "==", mlsNumber) .limit(1) .get()` |
| app/api/admin/listings-stats/route.ts:23 | GET | get | `firestore.collection(LISTINGS_COLLECTION).count().get()` |
| app/api/admin/listings-stats/route.ts:24 | GET | get | `firestore.collection(LISTINGS_COLLECTION).where("isVisible", "==", true).count().get()` |
| app/api/admin/listings-stats/route.ts:25 | GET | get | `firestore.collection(SETTINGS_COLLECTION).doc("mlsFullSyncCursor").get()` |
| app/api/admin/listings-stats/route.ts:26 | GET | get | `firestore.collection(SETTINGS_COLLECTION).doc("mlsIncrementalCursor").get()` |
| app/api/admin/listings-stats/route.ts:27 | GET | get | `firestore.collection(SETTINGS_COLLECTION).doc("mlsCleanupCursor").get()` |
| app/api/admin/listings-stats/route.ts:28 | GET | get | `firestore.collection(SETTINGS_COLLECTION).doc("mlsSchedulerStatus").get()` |
| app/api/admin/listings-stats/route.ts:29 | GET | get | `firestore.collection(SETTINGS_COLLECTION).doc("mlsManualSyncStatus").get()` |
| app/api/admin/mls-sync/route.ts:57 | POST | set | `firestore.collection(SETTINGS_COLLECTION).doc(MANUAL_STATUS_DOC_ID).set( { lastRunAt: new Date().toISOString(), lastRunMode: mode, lastRunStatus: "success", lastRunCounts: { fetched: result.stats.fetched, filtered: result.stats.filtered, created: result.stats.created, updated: result.stats.updated, deleted: result.stats.archived, archived: result.stats.archived, failed: result.stats.failed }, lastError: null }, { merge: true } )` |
| app/api/admin/mls-sync/route.ts:95 | POST | set | `firestore.collection(SETTINGS_COLLECTION).doc(MANUAL_STATUS_DOC_ID).set( { lastRunAt: new Date().toISOString(), lastRunMode: attemptedMode, lastRunStatus: "failed", lastError: detail }, { merge: true } )` |
| app/api/admin/schools/geocode/route.ts:104 | POST | get | `firestore.collection(COLLECTIONS.schools).get()` |
| app/api/admin/schools/geocode/route.ts:143 | POST | set | `firestore.collection(COLLECTIONS.schools).doc(candidate.docId).set(update, { merge: true })` |
| app/api/admin/schools/geocode/route.ts:167 | POST | set | `firestore.collection(COLLECTIONS.schools).doc(candidate.docId).set(failureUpdate, { merge: true })` |
| app/api/admin/schools/rankings/route.ts:133 | getSchools | get | `firestore.collection(COLLECTIONS.schools).get()` |
| app/api/admin/schools/rankings/route.ts:301 | commitRankings | set | `batch.set( reference, { ranking: result.ranking, rankingUpdatedAt: now, updatedAt: now }, { merge: true } )` |
| app/api/admin/schools/rankings/route.ts:314 | commitRankings | commit | `batch.commit()` |
| app/api/admin/schools/rankings/route.ts:321 | commitRankings | commit | `batch.commit()` |
| app/api/internal/mls-sync/scheduled/route.ts:134 | POST | get | `firestore.collection(SETTINGS_COLLECTION).doc(SCHEDULER_STATUS_DOC_ID).get()` |
| app/api/internal/mls-sync/scheduled/route.ts:160 | POST | set | `firestore.collection(SETTINGS_COLLECTION).doc(SCHEDULER_STATUS_DOC_ID).set( { lastRunAt: new Date().toISOString(), lastRunMode, lastRunStatus: overallStatus, lastRunCounts: counts, lastError: combinedError, lastNote: combinedNote, ...(cleanupAttempted ? { cleanupLastRunAt: new Date().toISOString(), cleanupLastRunStatus: cleanupError ? "failed" : "success", cleanupIntervalHours } : { cleanupIntervalHours }) }, { merge: true } )` |
| app/api/internal/mls-sync/scheduled/route.ts:221 | POST | set | `firestore.collection(SETTINGS_COLLECTION).doc(SCHEDULER_STATUS_DOC_ID).set( { lastRunAt: new Date().toISOString(), lastRunMode: "incremental+cleanup", lastRunStatus: "failed", lastRunCounts: counts, lastError: error instanceof Error ? error.message : "Unknown scheduler error" }, { merge: true } )` |
| app/api/saved-searches/route.ts:35 | GET | get | `firestore.collection(COLLECTION).where("userId", "==", user.uid).get()` |
| app/api/saved-searches/route.ts:69 | POST | set | `docRef.set(payload)` |
| app/api/saved-searches/route.ts:94 | PATCH | get | `docRef.get()` |
| app/api/saved-searches/route.ts:99 | PATCH | set | `docRef.set( { alertsEnabled: body.alertsEnabled === true, alertFrequency: parseAlertFrequency(body.alertFrequency), updatedAt: FieldValue.serverTimestamp() }, { merge: true } )` |
| app/api/saved-searches/route.ts:120 | DELETE | get | `docRef.get()` |
| app/api/saved-searches/route.ts:125 | DELETE | delete | `docRef.delete()` |
| hooks/useSavedHomes.ts:60 | SavedHomesProvider | onSnapshot | `onSnapshot( savedHomesQuery, (snapshot) => { const nextSavedHomes = snapshot.docs .map((savedHome) => { const data = savedHome.data() as SavedHomeDocument; return { id: savedHome.id, userId: data.userId, listingId: data.listingId, notes: typeof data.notes === "string" ? data.notes : "", createdAt: toIsoString(data.createdAt), updatedAt: toIsoString(data.updatedAt) } satisfies SavedHomeRecord; }) .sort((left, right) => toMillis(right.createdAt) - ` |
| lib/admin/queries.ts:48 | getAdminLeads | get | `firestore.collection(LEADS_COLLECTION).orderBy("createdAt", "desc").limit(limitCount).get()` |
| lib/admin/queries.ts:56 | getAdminContacts | get | `firestore.collection(CONTACTS_COLLECTION).limit(limitCount).get()` |
| lib/admin/queries.ts:71 | getAdminDashboardData | get | `firestore.collection(LEADS_COLLECTION).count().get()` |
| lib/admin/queries.ts:72 | getAdminDashboardData | get | `firestore.collection(CONTACTS_COLLECTION).count().get()` |
| lib/admin/queries.ts:73 | getAdminDashboardData | get | `firestore.collection(LISTINGS_COLLECTION).count().get()` |
| lib/admin/queries.ts:74 | getAdminDashboardData | get | `firestore.collection(LISTINGS_COLLECTION).where("isVisible", "==", true).count().get()` |
| lib/admin/queries.ts:77 | getAdminDashboardData | get | `firestore.collection(SETTINGS_COLLECTION).doc(SCHEDULER_STATUS_DOC_ID).get()` |
| lib/chat/store.ts:43 | appendChatConversation | runTransaction | `firestore.runTransaction(async (transaction) => { const existingSnapshot = await transaction.get(docRef); const existing = existingSnapshot.exists ? (existingSnapshot.data() as ChatConversationDocument) : null; const pagePaths = Array.from( new Set([...(existing?.pagePaths ?? []), ...(normalizedPagePath ? [normalizedPagePath] : [])]) ); const messages = [...(existing?.messages ?? []), userMessage, assistantMessage]; const record: ChatConversation` |
| lib/chat/store.ts:44 | appendChatConversation | get | `transaction.get(docRef)` |
| lib/chat/store.ts:73 | appendChatConversation | set | `transaction.set( docRef, writePayload, { merge: true } )` |
| lib/crm/campaigns-store.ts:42 | listRecentCrmCampaignLogs | get | `firestore.collection(CRM_SEND_LOG_COLLECTION).orderBy("sentAt", "desc").limit(limitCount).get()` |
| lib/crm/campaigns-store.ts:49 | getCrmCampaignSchedulerStatus | get | `firestore.collection(SETTINGS_COLLECTION).doc(CRM_CAMPAIGN_STATUS_DOC_ID).get()` |
| lib/crm/contacts-store.ts:269 | importCrmContactsFromCsv | set | `batch.set( firestore.collection(CRM_CONTACTS_COLLECTION).doc(record.id), { ...record, updatedAtServer: FieldValue.serverTimestamp(), importedAt: importedAt }, { merge: true } )` |
| lib/crm/contacts-store.ts:281 | importCrmContactsFromCsv | commit | `batch.commit()` |
| lib/crm/contacts-store.ts:292 | listCrmContacts | get | `firestore.collection(CRM_CONTACTS_COLLECTION).limit(limitCount).get()` |
| lib/crm/contacts-store.ts:308 | saveCrmContact | get | `docRef.get()` |
| lib/crm/contacts-store.ts:330 | saveCrmContact | set | `docRef.set( { ...record, updatedAtServer: FieldValue.serverTimestamp() }, { merge: true } )` |
| lib/crm/contacts-store.ts:346 | createCrmContact | get | `docRef.get()` |
| lib/crm/contacts-store.ts:374 | createCrmContact | set | `docRef.set( { ...record, updatedAtServer: FieldValue.serverTimestamp() }, { merge: false } )` |
| lib/crm/contacts-store.ts:396 | upsertCrmContactFromWebsiteMessage | runTransaction | `firestore.runTransaction(async (transaction) => { const snapshot = await transaction.get(docRef); const existing = snapshot.exists ? (snapshot.data() as Partial<CrmContactRecord>) : null; const existingNotes = sanitizeNotes(existing?.notes ?? ""); const record = buildStoredContactRecord(contactId, { ...existing, id: contactId, firstName: sanitizeText(existing?.firstName ?? "") &#124;&#124; firstName, lastName: sanitizeText(existing?.lastName ?? "") &#124;&#124; last` |
| lib/crm/contacts-store.ts:397 | upsertCrmContactFromWebsiteMessage | get | `transaction.get(docRef)` |
| lib/crm/contacts-store.ts:416 | upsertCrmContactFromWebsiteMessage | set | `transaction.set( docRef, { ...record, updatedAtServer: FieldValue.serverTimestamp() }, { merge: true } )` |
| lib/crm/contacts-store.ts:437 | deleteCrmContact | delete | `firestore.collection(CRM_CONTACTS_COLLECTION).doc(normalizedId).delete()` |
| lib/crm/contacts-store.ts:456 | unsubscribeCrmContactFromEmailLink | get | `docRef.get()` |
| lib/crm/contacts-store.ts:482 | unsubscribeCrmContactFromEmailLink | set | `docRef.set( { emailConsentStatus: "unsubscribed", unsubscribeSource: "crm-email-link", unsubscribedAt: now, unsubscribedAtServer: FieldValue.serverTimestamp(), updatedAt: now, updatedAtServer: FieldValue.serverTimestamp() }, { merge: true } )` |
| lib/crm/daily-campaigns.ts:80 | getSendLogStatus | get | `firestore.collection(CRM_SEND_LOG_COLLECTION).doc(logId).get()` |
| lib/crm/daily-campaigns.ts:87 | saveSendLog | set | `firestore.collection(CRM_SEND_LOG_COLLECTION).doc(record.id).set(record, { merge: true })` |
| lib/crm/daily-campaigns.ts:92 | saveRunSummary | set | `firestore.collection(SETTINGS_COLLECTION).doc(CRM_CAMPAIGN_STATUS_DOC_ID).set( { lastRunAt: new Date().toISOString(), lastRunStatus: status, lastRunDate: summary.runDate, lastRunCounts: { birthdaysDue: summary.birthdaysDue, holidaysDue: summary.holidaysDue, contactsEligible: summary.contactsEligible, sent: summary.sent, skipped: summary.skipped, failed: summary.failed, sentBirthday: summary.sentBirthday, sentHoliday: summary.sentHoliday }, lastEr` |
| lib/crm/templates-store.ts:115 | listCrmTemplates | get | `firestore.collection(CRM_TEMPLATES_COLLECTION).get()` |
| lib/crm/templates-store.ts:163 | saveCrmTemplate | get | `docRef.get()` |
| lib/crm/templates-store.ts:185 | saveCrmTemplate | set | `docRef.set( { ...merged, updatedAtServer: FieldValue.serverTimestamp() }, { merge: true } )` |
| lib/crm/templates-store.ts:228 | createCrmTemplate | get | `firestore.collection(CRM_TEMPLATES_COLLECTION).doc(templateId).get()` |
| lib/crm/templates-store.ts:239 | createCrmTemplate | set | `firestore.collection(CRM_TEMPLATES_COLLECTION).doc(templateId).set( { ...template, updatedAtServer: FieldValue.serverTimestamp() }, { merge: false } )` |
| lib/crm/templates-store.ts:273 | deleteCrmTemplate | set | `firestore.collection(CRM_TEMPLATES_COLLECTION).doc(normalizedId).set( { id: normalizedId, deletedAt: now, updatedAt: now, updatedAtServer: FieldValue.serverTimestamp() }, { merge: false } )` |
| lib/leads/communications-store.ts:36 | storeCommunication | set | `docRef.set(record)` |
| lib/leads/contact-store.ts:20 | storeContactSubmission | set | `docRef.set({ ...record, createdAtServer: FieldValue.serverTimestamp() })` |
| lib/leads/contact-store.ts:52 | updateContactEmailDeliveryStatus | set | `firestore .collection(CONTACT_COLLECTION) .doc(contactId) .set( { ...update, emailProcessedAt: new Date().toISOString(), emailProcessedAtServer: FieldValue.serverTimestamp() }, { merge: true } )` |
| lib/leads/contacts-store.ts:102 | upsertContactFromLead | runTransaction | `firestore.runTransaction(async (transaction) => { const existingSnapshot = await transaction.get(docRef); const existing = existingSnapshot.exists ? (existingSnapshot.data() as ContactProfileDocument) : null; const existingCriteria = ensureSearchCriteria(existing?.searchCriteria); const existingListings = ensureListings(existing?.recentListings); const incomingListing: ContactListingReference = { listingId: lead.listingId, mlsNumber: lead.listing` |
| lib/leads/contacts-store.ts:103 | upsertContactFromLead | get | `transaction.get(docRef)` |
| lib/leads/contacts-store.ts:142 | upsertContactFromLead | set | `transaction.set( docRef, { ...mergedDocument, updatedAtServer: FieldValue.serverTimestamp() }, { merge: true } )` |
| lib/leads/contacts-store.ts:165 | upsertContactFromMessage | runTransaction | `firestore.runTransaction(async (transaction) => { const existingSnapshot = await transaction.get(docRef); const existing = existingSnapshot.exists ? (existingSnapshot.data() as ContactProfileDocument) : null; const existingCriteria = ensureSearchCriteria(existing?.searchCriteria); const mergedSummaryParts = [contact.subject.trim(), contact.message.trim()].filter((part) => part.length > 0); const mergedDocument: ContactProfileDocument = { id: docI` |
| lib/leads/contacts-store.ts:166 | upsertContactFromMessage | get | `transaction.get(docRef)` |
| lib/leads/contacts-store.ts:195 | upsertContactFromMessage | set | `transaction.set( docRef, { ...mergedDocument, updatedAtServer: FieldValue.serverTimestamp() }, { merge: true } )` |
| lib/leads/store.ts:22 | storeLeadSubmission | set | `docRef.set({ ...record, createdAtServer: FieldValue.serverTimestamp() })` |
| lib/leads/store.ts:54 | updateLeadEmailDeliveryStatus | set | `firestore .collection(LEADS_COLLECTION) .doc(leadId) .set( { ...update, emailProcessedAt: new Date().toISOString(), emailProcessedAtServer: FieldValue.serverTimestamp() }, { merge: true } )` |
| lib/listings/firestore-data.ts:255 | getPublicListingsByIdsFromFirestore | get | `firestore.collection("listings").where("listingId", "in", chunk).get()` |
| lib/market/report-content.ts:64 | getMarketReportContent | get | `firestore.collection(MARKET_REPORTS_COLLECTION).doc(fallback.id).get()` |
| lib/market/report-content.ts:83 | saveMarketReportContent | set | `firestore.collection(MARKET_REPORTS_COLLECTION).doc(fallback.id).set(content, { merge: true })` |
| lib/mls/sync/cleanupCursor.ts:21 | getCleanupStartPage | get | `firestore.collection(SETTINGS_COLLECTION).doc(CLEANUP_CURSOR_DOC_ID).get()` |
| lib/mls/sync/cleanupCursor.ts:33 | setCleanupStartPage | set | `firestore.collection(SETTINGS_COLLECTION).doc(CLEANUP_CURSOR_DOC_ID).set( { nextPage: safePage, updatedAt: new Date().toISOString(), updatedAtServer: FieldValue.serverTimestamp() }, { merge: true } )` |
| lib/mls/sync/cleanupCursor.ts:45 | getCleanupNextCursor | get | `firestore.collection(SETTINGS_COLLECTION).doc(CLEANUP_CURSOR_DOC_ID).get()` |
| lib/mls/sync/cleanupCursor.ts:54 | setCleanupNextCursor | set | `firestore.collection(SETTINGS_COLLECTION).doc(CLEANUP_CURSOR_DOC_ID).set( { nextCursor, updatedAt: new Date().toISOString(), updatedAtServer: FieldValue.serverTimestamp() }, { merge: true } )` |
| lib/mls/sync/cleanupCursor.ts:66 | getCleanupSweepStartedAt | get | `firestore.collection(SETTINGS_COLLECTION).doc(CLEANUP_CURSOR_DOC_ID).get()` |
| lib/mls/sync/cleanupCursor.ts:75 | setCleanupSweepStartedAt | set | `firestore.collection(SETTINGS_COLLECTION).doc(CLEANUP_CURSOR_DOC_ID).set( { sweepStartedAt, updatedAt: new Date().toISOString(), updatedAtServer: FieldValue.serverTimestamp() }, { merge: true } )` |
| lib/mls/sync/fullSyncCursor.ts:17 | getFullSyncStartPage | get | `firestore.collection(SETTINGS_COLLECTION).doc(FULL_SYNC_CURSOR_DOC_ID).get()` |
| lib/mls/sync/fullSyncCursor.ts:29 | setFullSyncStartPage | set | `firestore.collection(SETTINGS_COLLECTION).doc(FULL_SYNC_CURSOR_DOC_ID).set( { nextPage: safePage, updatedAt: new Date().toISOString(), updatedAtServer: FieldValue.serverTimestamp() }, { merge: true } )` |
| lib/mls/sync/fullSyncCursor.ts:41 | getFullSyncNextCursor | get | `firestore.collection(SETTINGS_COLLECTION).doc(FULL_SYNC_CURSOR_DOC_ID).get()` |
| lib/mls/sync/fullSyncCursor.ts:50 | setFullSyncNextCursor | set | `firestore.collection(SETTINGS_COLLECTION).doc(FULL_SYNC_CURSOR_DOC_ID).set( { nextCursor, updatedAt: new Date().toISOString(), updatedAtServer: FieldValue.serverTimestamp() }, { merge: true } )` |
| lib/mls/sync/fullSyncCursor.ts:66 | getFullSyncSweepStartedAt | get | `firestore.collection(SETTINGS_COLLECTION).doc(FULL_SYNC_CURSOR_DOC_ID).get()` |
| lib/mls/sync/fullSyncCursor.ts:75 | setFullSyncSweepStartedAt | set | `firestore.collection(SETTINGS_COLLECTION).doc(FULL_SYNC_CURSOR_DOC_ID).set( { sweepStartedAt, updatedAt: new Date().toISOString(), updatedAtServer: FieldValue.serverTimestamp() }, { merge: true } )` |
| lib/mls/sync/incrementalSyncCursor.ts:20 | getIncrementalSyncSince | get | `firestore.collection(SETTINGS_COLLECTION).doc(INCREMENTAL_CURSOR_DOC_ID).get()` |
| lib/mls/sync/incrementalSyncCursor.ts:45 | setIncrementalSyncSince | set | `firestore.collection(SETTINGS_COLLECTION).doc(INCREMENTAL_CURSOR_DOC_ID).set( { sinceIso: safeIso, updatedAt: new Date().toISOString(), updatedAtServer: FieldValue.serverTimestamp() }, { merge: true } )` |
| lib/mls/sync/incrementalSyncCursor.ts:61 | getIncrementalStartPage | get | `firestore.collection(SETTINGS_COLLECTION).doc(INCREMENTAL_CURSOR_DOC_ID).get()` |
| lib/mls/sync/incrementalSyncCursor.ts:73 | setIncrementalStartPage | set | `firestore.collection(SETTINGS_COLLECTION).doc(INCREMENTAL_CURSOR_DOC_ID).set( { nextPage: safePage, updatedAt: new Date().toISOString(), updatedAtServer: FieldValue.serverTimestamp() }, { merge: true } )` |
| lib/mls/sync/incrementalSyncCursor.ts:85 | getIncrementalNextCursor | get | `firestore.collection(SETTINGS_COLLECTION).doc(INCREMENTAL_CURSOR_DOC_ID).get()` |
| lib/mls/sync/incrementalSyncCursor.ts:94 | setIncrementalNextCursor | set | `firestore.collection(SETTINGS_COLLECTION).doc(INCREMENTAL_CURSOR_DOC_ID).set( { nextCursor, updatedAt: new Date().toISOString(), updatedAtServer: FieldValue.serverTimestamp() }, { merge: true } )` |
| lib/mls/sync/incrementalSyncCursor.ts:106 | getIncrementalSweepStartedAt | get | `firestore.collection(SETTINGS_COLLECTION).doc(INCREMENTAL_CURSOR_DOC_ID).get()` |
| lib/mls/sync/incrementalSyncCursor.ts:115 | setIncrementalSweepStartedAt | set | `firestore.collection(SETTINGS_COLLECTION).doc(INCREMENTAL_CURSOR_DOC_ID).set( { sweepStartedAt, updatedAt: new Date().toISOString(), updatedAtServer: FieldValue.serverTimestamp() }, { merge: true } )` |
| lib/mls/sync/publicQueries.ts:59 | getPublicListings | get | `firestore .collection(LISTINGS_COLLECTION) .where("isVisible", "==", true) .where("municipality", "in", allowedMunicipalities) .orderBy("price", "desc") .limit(limit) .get()` |
| lib/mls/sync/publicQueries.ts:72 | getPublicListingBySlug | get | `firestore .collection(LISTINGS_COLLECTION) .where("slug", "==", slug) .where("isVisible", "==", true) .limit(1) .get()` |
| lib/mls/sync/publicQueries.ts:90 | getPublicListingByMlsNumber | get | `firestore .collection(LISTINGS_COLLECTION) .where("mlsNumber", "==", normalizedMlsNumber) .where("isVisible", "==", true) .limit(1) .get()` |
| lib/mls/sync/publicQueries.ts:116 | getListingsByAgentKey | get | `firestore.collection(LISTINGS_COLLECTION).where("listAgentKey", "==", normalizedAgentKey).get()` |
| lib/mls/sync/publicQueries.ts:117 | getListingsByAgentKey | get | `firestore.collection(LISTINGS_COLLECTION).where("listAgentNationalAssociationId", "==", normalizedAgentKey).get()` |
| lib/mls/sync/publicQueries.ts:139 | getListingsByMunicipality | get | `firestore .collection(LISTINGS_COLLECTION) .where("isVisible", "==", true) .where("municipality", "==", municipality) .orderBy("price", "desc") .limit(limit) .get()` |
| lib/mls/sync/publicQueries.ts:164 | getListingStatsByMunicipality | get | `baseQuery.count().get()` |
| lib/mls/sync/publicQueries.ts:165 | getListingStatsByMunicipality | get | `baseQuery.where("transactionType", "==", "sale").count().get()` |
| lib/mls/sync/publicQueries.ts:166 | getListingStatsByMunicipality | get | `baseQuery.where("transactionType", "==", "lease").count().get()` |
| lib/mls/sync/publicQueries.ts:214 | getMonthlyMarketStatsSource | get | `baseQuery.count().get()` |
| lib/mls/sync/publicQueries.ts:215 | getMonthlyMarketStatsSource | get | `saleQuery.count().get()` |
| lib/mls/sync/publicQueries.ts:216 | getMonthlyMarketStatsSource | get | `leaseQuery.count().get()` |
| lib/mls/sync/publicQueries.ts:217 | getMonthlyMarketStatsSource | get | `saleQuery.aggregate({ averagePrice: AggregateField.average("price") }).get()` |
| lib/mls/sync/publicQueries.ts:218 | getMonthlyMarketStatsSource | get | `leaseQuery.aggregate({ averagePrice: AggregateField.average("price") }).get()` |
| lib/mls/sync/publicQueries.ts:219 | getMonthlyMarketStatsSource | get | `baseQuery.select("createdAt").get()` |
| lib/mls/sync/publicQueries.ts:293 | getListingsNearCoordinate | get | `query.get()` |
| lib/mls/sync/publicQueries.ts:392 | getFilteredListingsPage | get | `query.count().get()` |
| lib/mls/sync/publicQueries.ts:398 | getFilteredListingsPage | get | `query.offset(offset).limit(pageSize).get()` |
| lib/mls/sync/publicQueries.ts:425 | getAllPublicListings | get | `query.get()` |
| lib/mls/sync/publicQueries.ts:456 | getPublicListingsForMunicipality | get | `query.get()` |
| lib/mls/sync/stopSignal.ts:14 | requestMLSSyncStop | set | `firestore.collection(SETTINGS_COLLECTION).doc(STOP_SIGNAL_DOC_ID).set( { requested: true, requestedAt: new Date().toISOString() } satisfies StopSignalDocument, { merge: true } )` |
| lib/mls/sync/stopSignal.ts:25 | clearMLSSyncStop | set | `firestore.collection(SETTINGS_COLLECTION).doc(STOP_SIGNAL_DOC_ID).set( { requested: false, clearedAt: new Date().toISOString() } satisfies StopSignalDocument, { merge: true } )` |
| lib/mls/sync/stopSignal.ts:36 | isMLSSyncStopRequested | get | `firestore.collection(SETTINGS_COLLECTION).doc(STOP_SIGNAL_DOC_ID).get()` |
| lib/mls/upsert/repository.ts:19 | getListingById | get | `firestore.collection(COLLECTIONS.listings).doc(listingId).get()` |
| lib/mls/upsert/repository.ts:26 | upsertListingDocument | set | `firestore.collection(COLLECTIONS.listings).doc(doc.listingId).set( { ...doc, updatedAtServer: FieldValue.serverTimestamp() }, { merge: true } )` |
| lib/mls/upsert/repository.ts:37 | touchListingLastSeen | set | `firestore.collection(COLLECTIONS.listings).doc(listingId).set( { lastSeenInSourceAt: nowIso, syncedAt: nowIso, updatedAtServer: FieldValue.serverTimestamp() }, { merge: true } )` |
| lib/mls/upsert/repository.ts:49 | hideListingDocument | set | `firestore.collection(COLLECTIONS.listings).doc(listingId).set( { isVisible: false, hiddenReason, syncedAt: nowIso, updatedAt: nowIso, updatedAtServer: FieldValue.serverTimestamp() }, { merge: true } )` |
| lib/mls/upsert/repository.ts:63 | deleteListingDocument | delete | `firestore.collection(COLLECTIONS.listings).doc(listingId).delete()` |
| lib/mls/upsert/repository.ts:77 | deleteExistingListingDocuments | getAll | `firestore.getAll(...refs)` |
| lib/mls/upsert/repository.ts:83 | deleteExistingListingDocuments | delete | `batch.delete(snapshot.ref)` |
| lib/mls/upsert/repository.ts:85 | deleteExistingListingDocuments | commit | `batch.commit()` |
| lib/mls/upsert/repository.ts:94 | listAllListingIds | get | `firestore.collection(COLLECTIONS.listings).select().get()` |
| lib/mls/upsert/repository.ts:100 | listStaleVisibleListings | get | `firestore .collection(COLLECTIONS.listings) .where("isVisible", "==", true) .where("lastSeenInSourceAt", "<", staleBeforeIso) .get()` |
| lib/mls/upsert/repository.ts:111 | listListingsNotSeenSince | get | `firestore .collection(COLLECTIONS.listings) .where("lastSeenInSourceAt", "<", staleBeforeIso) .get()` |
| lib/mls/upsert/repository.ts:123 | listListingsByMunicipality | get | `firestore.collection(COLLECTIONS.listings).where("municipality", "==", municipality).get()` |
| lib/mls/upsert/repository.ts:129 | listHiddenListings | get | `firestore.collection(COLLECTIONS.listings).where("isVisible", "==", false).get()` |
| lib/mls/upsert/repository.ts:140 | listListingsWithStatuses | get | `firestore.collection(COLLECTIONS.listings).where("status", "in", uniqueStatuses).get()` |
| lib/mls/upsert/repository.ts:165 | createListingSnapshot | set | `firestore.collection(COLLECTIONS.listingSnapshots).doc(snapshotDoc.snapshotId).set(snapshotDoc)` |
| lib/savedHomes.ts:51 | saveHomeRecord | setDoc | `setDoc( doc(db, SAVED_HOMES_COLLECTION, buildSavedHomeDocumentId(userId, trimmedListingId)), { userId, listingId: trimmedListingId, createdAt: serverTimestamp() }, { merge: true } )` |
| lib/savedHomes.ts:63 | removeHomeRecord | deleteDoc | `deleteDoc(doc(db, SAVED_HOMES_COLLECTION, buildSavedHomeDocumentId(userId, listingId.trim())))` |
| lib/savedHomes.ts:77 | updateSavedHomeNotes | setDoc | `setDoc( doc(db, SAVED_HOMES_COLLECTION, buildSavedHomeDocumentId(userId, trimmedListingId)), { userId, listingId: trimmedListingId, notes: notes.slice(0, 3000), updatedAt: serverTimestamp() }, { merge: true } )` |
| lib/savedHomes.ts:90 | getUserSavedHomeIds | getDocs | `getDocs(query(collection(db, SAVED_HOMES_COLLECTION), where("userId", "==", userId)))` |
| lib/savedSearches.ts:64 | saveSearchRecord | addDoc | `addDoc(collection(db, SAVED_SEARCHES_COLLECTION), { userId: input.userId, userEmail: input.userEmail &#124;&#124; null, label, path: input.path, queryString: input.queryString, filters: sanitizeListingFilters(input.filters), resultsTotal: input.resultsTotal, alertsEnabled: input.alertsEnabled ?? true, alertFrequency: input.alertFrequency &#124;&#124; "daily", lastAlertCheckedAt: null, lastAlertListingIds: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp(` |
| lib/savedSearches.ts:105 | updateSavedSearchAlerts | setDoc | `setDoc( doc(db, SAVED_SEARCHES_COLLECTION, searchId), { alertsEnabled: options.alertsEnabled, alertFrequency: options.alertFrequency, updatedAt: serverTimestamp() }, { merge: true } )` |
| lib/savedSearches.ts:117 | removeSavedSearchRecord | deleteDoc | `deleteDoc(doc(db, SAVED_SEARCHES_COLLECTION, searchId))` |
| lib/schools/firestore-data.ts:50 | importSeedSchoolsToFirestore | set | `batch.set( reference, { ...document, sourceVersion: SCHOOL_DATA_VERSION }, { merge: true } )` |
| lib/schools/firestore-data.ts:61 | importSeedSchoolsToFirestore | commit | `batch.commit()` |
| lib/schools/firestore-data.ts:95 | getSchoolsFromFirestore | get | `firestore.collection(COLLECTIONS.schools).get()` |
| lib/searches/saved-search-alerts.ts:57 | runSavedSearchAlerts | get | `firestore.collection("savedSearches").where("alertsEnabled", "==", true).get()` |
| lib/searches/saved-search-alerts.ts:105 | runSavedSearchAlerts | set | `docSnapshot.ref.set( { lastAlertCheckedAt: FieldValue.serverTimestamp(), lastAlertListingIds: nextAlertListingIds, updatedAt: FieldValue.serverTimestamp() }, { merge: true } )` |
| lib/searches/store.ts:20 | storeSearchLog | set | `docRef.set({ id: docRef.id, createdAt, createdAtServer: FieldValue.serverTimestamp(), path: input.path, queryString: input.queryString, resultsTotal: input.resultsTotal, userAgent: input.userAgent &#124;&#124; null, filters: input.filters })` |
| lib/searches/unsubscribe.ts:76 | getSavedSearchUnsubscribePreview | get | `docRef.get()` |
| lib/searches/unsubscribe.ts:124 | unsubscribeSavedSearchFromEmailLink | set | `docRef.set( { alertsEnabled: false, unsubscribeSource: "saved-search-alert-email-link", unsubscribedAt: new Date().toISOString(), unsubscribedAtServer: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true } )` |
| lib/settings/site-settings.ts:58 | getSiteSettingsFromFirestore | get | `firestore.collection(SETTINGS_COLLECTION).doc(SITE_SETTINGS_DOCUMENT).get()` |
| lib/settings/site-settings.ts:80 | updateFeaturedListingIds | set | `firestore.collection(SETTINGS_COLLECTION).doc(SITE_SETTINGS_DOCUMENT).set( { featuredListingIds: sanitized, updatedAt: new Date().toISOString() }, { merge: true } )` |
| lib/showings.ts:28 | getUserShowings | getDocs | `getDocs(query(collection(db, "leads"), where("userId", "==", userId)))` |
