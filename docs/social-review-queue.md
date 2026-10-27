# Manual social review queue

New eligible listings inserted after this release get a lightweight campaign in the same fenced MLS transaction. It includes captions, the source photo, listing-created date, draft-created date, and the New classification. It does not render images or contact Meta. Updates preserve the campaign and its publication history.

Earlier inventory can be imported from Existing listings with Import brokerage listings. It queries brokerageName equal to RE/MAX METROPOLIS REALTY, processes 100 matching records per request, and automatically continues until complete while the page stays open. An interrupted import resumes from its saved cursor; a completed import resets the cursor for future refreshes. Only eligible properties get drafts; existing campaigns are preserved. Earlier previews remain in Existing listings. Dates are displayed in America/Toronto; listing-added date is the website record's createdAt, not the original MLS market date.

Generate carousel, review slides and captions, then click Publish now. That action records publishApprovedAt and advances the worker. The server live switch and Meta credentials remain required. Scheduler ticks cannot approve campaigns. Existing automatic campaigns without approval cannot publish. A scheduler can continue approved processing/retries; without one, Run next queue step advances them manually. Legacy settings.enabled does not enable automatic publication.

Deploy the website application. No separate Functions deployment is required. No posts were published during implementation. Remaining production memory pressure must still be monitored during image generation.
