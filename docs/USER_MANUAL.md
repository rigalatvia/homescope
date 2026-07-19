# HomeScope GTA User Manual

This manual is for the person operating HomeScope GTA day to day. It focuses on how to use the website, the admin area, and the operational tools without needing to read the code.

## 1. What HomeScope GTA Does

HomeScope GTA has four main public-facing jobs:

- show real estate listings for the supported markets
- help visitors request showings
- collect contact and search activity
- provide buyer, renter, and document guides

It also has an admin area to:

- run MLS sync jobs
- review leads and contacts
- manage featured listings
- review sync status

## 2. Main Areas of the Site

Public website:

- homepage
- listings search
- listing detail pages
- guides section
- contact page
- thank-you page after showing requests

Admin area:

- `/admin`
- `/admin/sync`
- `/admin/featured`
- `/admin/leads`
- `/admin/contacts`

## 3. Logging Into Admin

The admin area is protected by a token-based login.

How it works:

1. Go to `/admin/login`
2. Enter the admin sync token
3. Submit
4. If successful, you will be redirected into `/admin`

Important notes:

- the session is stored in a secure cookie
- the cookie is scoped to `/admin`
- if the token changes in server configuration, the old login session will no longer be valid

## 4. Admin Dashboard

Admin dashboard route:

- `/admin`

What you will see:

- total leads
- total contacts
- total listings
- visible listings
- latest leads preview
- alphabetical contacts preview
- quick actions

Use the dashboard to quickly confirm whether:

- the listing inventory is populated
- lead flow is working
- contact storage is working

## 5. MLS Sync Operations

Admin sync route:

- `/admin/sync`

This page is one of the most important operational pages in the system.

### 5.1 What the sync page can do

- run a full sync
- run a full sync across all pages
- run an incremental sync
- run cleanup
- stop a running sync
- refresh listing stats
- show scheduler status

### 5.2 Sync types explained

#### Full sync

Use when:

- initial population is needed
- a large correction was made in mapping logic
- you want the broadest reprocessing of source data

What it does:

- fetches source pages from the DDF feed
- normalizes and filters the data
- updates listings in Firestore
- removes or hides records according to sync logic

#### Incremental sync

Use when:

- you want the fastest normal operational update
- source changes since the last sync should be pulled
- nightly/recurring updates are running

Incremental sync also runs the municipality cleanup logic that now removes wrong `King` listings caused by source names like:

- Kingston
- Kingsville

#### Cleanup

Use when:

- you want stale-listing cleanup behavior only
- you are troubleshooting visibility or stale records

### 5.3 Stopping a sync

The sync stop is cooperative. That means:

- it does not kill a request in the middle of a fetch
- it stops at the next safe boundary

Use `Stop Run` if:

- a full sync was started by mistake
- credentials are wrong and you want to stop
- the run should pause so you can redeploy

### 5.4 Nightly Incremental Status

The admin sync page shows:

- last run time
- last run status
- fetched
- filtered
- created
- updated
- deleted records
- errors if present

`Deleted Records` reflects archived/removed records tracked by the scheduler status document.

## 6. Featured Listings

Admin featured route:

- `/admin/featured`

What this page does:

- allows you to manage manually featured listings
- lets you add a featured listing by MLS number
- lets you move featured listings up or down
- stores featured listing IDs in Firestore settings

Current featured behavior also includes logic around a preferred agent key in code, but the admin panel is the safest manual override point.

Use this page when:

- you want to pin certain listings
- you want to control homepage emphasis
- you want Yan's listings or any manually selected listings to appear first

Important notes:

- enter the public MLS number, such as `N13194128`
- the admin panel resolves that MLS number to the internal listing document
- the homepage uses the saved order, with the first item shown first
- if a listing does not appear after saving, check that the listing exists in Firestore and is visible/public

## 7. Leads

Admin leads route:

- `/admin/leads`

A lead is usually created when someone submits a showing request or asks for listing details from a listing page.

What gets saved:

- full name
- email
- phone
- message
- listing information
- transaction type
- lead intent, such as showing request or question
- form type, such as showing or contact
- SMS consent preference
- delivery status fields for email handling

Important operational behavior:

- after a showing request is submitted, the user is redirected to a thank-you page
- the thank-you page is important for Google Ads conversion tracking
- after an Ask for Details request is submitted, the user stays on the listing page and sees an inline confirmation message
- the confirmation copy tells users to expect an email from:
  - `homescopegta@gmail.com`
- lead notification emails are sent to `settings/site.leadRecipientEmail`
- if `settings/site.leadRecipientEmail` is empty, the code falls back to the default HomeScope GTA lead recipient

## 8. Contacts

Admin contacts route:

- `/admin/contacts`

Contacts are deduplicated profiles built from:

- showing leads
- contact form submissions

This is useful for understanding the relationship history of a person without manually combining multiple records.

What the contact profile may show:

- name
- email
- phone
- lead count
- contact message count
- recent listing interest
- summarized search criteria
- SMS consent

Use this page when:

- you want to see repeat interest
- you want a cleaner CRM-style overview

## 9. CRM Birthday and Holiday Campaign Emails

CRM campaign emails are the automated birthday and holiday emails sent from Yan's campaign sender.

Important unsubscribe behavior:

- CRM birthday and holiday emails include an unsubscribe link
- the unsubscribe link updates the matching `crmContacts` record
- the contact's `emailConsentStatus` is set to `unsubscribed`
- future CRM campaign runs skip contacts marked `unsubscribed`
- this applies only to CRM campaign emails, not saved-search alerts, lead notifications, showing notifications, or Ask for Details notifications

Firestore collections involved:

- `crmContacts`
- `crmSendLog`

Use `/admin/contacts` if you need to manually review or change a contact's email consent status.

## 10. Public Listings Search

Public route:

- `/listings`
- `/schools`

What visitors can do:

- filter by city
- choose sale or lease
- set price range
- filter bedrooms and bathrooms
- choose property type
- search by MLS number
- search by address text
- browse on a map
- search schools and open school profile pages
- sort school results by name
- sort school results by rating, high to low or low to high
- page through school results beyond the first 75 schools

### 10.1 Search tracking

Every listings search is saved in Firestore.

School searches are also tracked so search traffic from the school search page can be reviewed later.

Saved information includes:

- path
- query string
- filters used
- result count
- user agent

This is useful for:

- understanding demand
- marketing decisions
- future reporting

### 10.2 School search behavior

School search route:

- `/schools`

School detail route pattern:

- `/schools/[slug]`

What visitors can do:

- search by school name, board, or program
- filter by municipality
- filter by level
- sort by name
- sort by rating in both directions
- use pagination to see more than the first 75 results
- open a school profile and see nearby homes

Important behavior:

- the Back to school search button on a school detail page uses browser back behavior
- rating and school boundary information should still be verified directly with the school board

## 11. Listing Detail Pages

Public route pattern:

- `/listings/[slug]`

What users can do:

- browse images
- review property details
- open the showing request form
- open the Ask for Details form
- navigate to related buying or leasing guides

Guide links on listing pages are contextual:

For sale listings show sale-focused guides.

For lease listings show leasing-focused guides, including:

- Ontario Leasing Guide
- Lease Documents
- Rental Application Form 410

## 12. Showing Request Form

The showing request form is one of the most important conversion points on the site.

What it now does:

- validates input
- stores the lead in Firestore
- stores SMS consent preference
- updates or creates a contact profile
- redirects to a thank-you page

### 12.1 SMS consent

There is a checkbox asking whether the user agrees to receive text messages on their phone.

This preference is saved and should be respected in follow-up outreach.

### 12.2 Thank-you page

Route:

- `/thank-you/showing-request`

Purpose:

- confirmation for users
- Google Ads conversion destination

The page also includes:

- return-back button
- browse listings option

## 13. Ask for Details Form

Listing pages also include an Ask for Details button beside the showing request button.

Use this when a visitor wants to ask a question before booking a showing.

What it asks for:

- email
- question or message
- optional name

What gets attached automatically:

- listing title
- listing address
- city
- MLS number
- listing URL
- transaction type

What happens after submit:

- the question is saved in `leads`
- the contact profile is updated or created
- email notification is attempted
- the visitor sees a confirmation message on the listing page

Confirmation message:

- `Thank you. Your question was received. We will reply by email shortly.`

This form does not redirect to the thank-you page because it is a lightweight listing question, not the main showing-request conversion.

## 14. Contact Form

Public route:

- `/contact`

What happens when a user submits:

1. the message is validated
2. saved to Firestore
3. merged into the `contacts` collection
4. email notification is attempted
5. delivery status is written back to Firestore

If email is unavailable, the message is still stored.

## 15. Guides Section

Public route:

- `/guides`

The guides area contains:

- buyer guides
- leasing guides
- document checklists
- rental application form page

Purpose:

- educate users
- improve SEO
- support users before they contact you

### Important guide routes

- `/guides/first-time-home-buyer-ontario`
- `/guides/documents-needed-buy-house-toronto`
- `/guides/organize-real-estate-documents-canada`
- `/guides/rental-application-ontario`
- `/guides/buying`
- `/guides/leasing`
- `/guides/lease-documents`

## 16. Rental Application Resource

Public PDF URL:

- `/forms/410-rental-application-ontario.pdf`

Guide page:

- `/guides/rental-application-ontario`

What users can do:

- read what Form 410 generally asks for
- download the form
- move to listings if they are ready to search

Download tracking is built into the site analytics.

## 17. Chatbot

The site includes a floating chatbot button:

- `Ask HomeScope`

What it can answer:

- rental application questions
- lease document questions
- showing request questions
- buyer document questions
- first-time buyer guide questions

How it works right now:

- it uses the content and guides already on the site
- it is not a general-purpose AI assistant
- every conversation is saved to Firestore

Why it is useful:

- lets visitors get answers immediately
- helps you see common questions through saved conversations

## 18. Search Console and SEO Expectations

The site includes:

- sitemap
- robots file
- page metadata
- guide metadata
- article schema on guides

Important operational note:

Google Search Console reports can lag.

That means:

- internal links may exist in code before Search Console shows them
- new guides can be discovered but not crawled immediately
- indexing status may take time to catch up

## 19. Listing Snapshots

Firestore collection:

- `listingSnapshots`

This collection stores listing change history from MLS sync.

It is not the public listings table. The public current listing records are in:

- `listings`

What a listing snapshot records:

- listing ID
- source listing key
- when the snapshot was captured
- which tracked fields changed
- previous values
- new values
- reason for the snapshot, such as created, updated, hidden, price changed, status changed, or remarks changed

Tracked fields include:

- price
- status
- property type
- common interest
- structure type
- property attached
- public remarks
- visibility
- hidden reason

Use `listingSnapshots` when:

- a price changed and you want to see the previous value
- a listing became hidden
- a status changed
- you need to understand what changed during a sync

Do not use `listingSnapshots` as the main source for showing listings on the public site.

## 20. Common Daily Tasks

### Daily

- check `/admin`
- check `/admin/sync`
- confirm hourly incremental status is succeeding
- confirm saved-search alert scheduler is succeeding
- check new leads
- check new contacts

### Weekly

- review listing inventory counts
- review any municipality or sync anomalies
- review featured listings
- test one Ask for Details lead
- review search patterns in Firestore if needed
- review chatbot conversations for frequent questions

### Monthly

- verify Search Console sitemap health
- review contact and lead quality
- check email delivery behavior
- confirm scheduler is still running correctly

## 21. Common Troubleshooting

### Problem: new listings are missing

Check:

- `/admin/sync`
- scheduler status
- DDF credentials
- cursor settings
- whether listing is being filtered by municipality or visibility rules

### Problem: wrong municipality listings appear under King

Current fix exists for:

- Kingston
- Kingsville

Run an incremental sync after deploy so cleanup removes those wrong records.

### Problem: a user says they did not get a showing email

Check:

- lead exists in `leads`
- user was told to check junk folder
- email provider mode
- delivery status fields on the lead record
- `settings/site` email recipient

### Problem: an Ask for Details email was not received

Check:

- lead exists in `leads`
- lead `intent` is `question`
- delivery status fields on the lead record
- `settings/site.leadRecipientEmail`
- email provider mode
- Gmail app password secrets
- whether the local development server is using mock email mode

### Problem: someone wants to stop CRM campaign emails

Check:

- the unsubscribe link in the CRM birthday or holiday email
- `/admin/contacts`
- the contact's `emailConsentStatus`

Contacts marked `unsubscribed` are skipped by future CRM daily campaign runs.

### Problem: Search Console says pages are discovered but not indexed

This usually means:

- Google found them
- but has not crawled them yet

Internal linking is already present in multiple places, so this is often a crawl-timing issue rather than a code issue.

### Problem: featured listings look wrong

Check:

- `/admin/featured`
- `settings/site.featuredListingIds`
- current listing visibility
- whether those listing documents are present and public
- whether the MLS number resolves to the expected internal listing document

### Problem: chatbot is not answering broadly enough

Current chatbot is content-backed, not model-backed. It should answer site-specific questions well, but it is not intended for open-domain real estate Q&A.

## 22. Operational Best Practices

- do not edit Firestore listing records by hand unless necessary
- prefer fixing sync logic and rerunning sync
- keep `settings/site` maintained
- keep email secrets valid
- preserve admin token securely
- review SMS consent before sending texts
- respect CRM unsubscribe status before sending birthday or holiday campaign emails
- use the thank-you page URL for ad conversion tracking

## 23. Quick Reference

### Important admin URLs

- `/admin`
- `/admin/sync`
- `/admin/featured`
- `/admin/leads`
- `/admin/contacts`

### Important public URLs

- `/`
- `/listings`
- `/schools`
- `/contact`
- `/guides`
- `/guides/rental-application-ontario`
- `/thank-you/showing-request`

### Important Firestore collections

- `listings`
- `leads`
- `contactMessages`
- `contacts`
- `searches`
- `chatConversations`
- `crmContacts`
- `crmSendLog`
- `listingSnapshots`
- `settings`

### Important settings documents

- `settings/site`
- `settings/mlsFullSyncCursor`
- `settings/mlsIncrementalCursor`
- `settings/mlsSchedulerStatus`

## 24. Final Summary

If you only remember the essentials:

- use `/admin/sync` to manage the MLS feed
- use `/admin/leads` and `/admin/contacts` to manage inbound demand
- use `/admin/featured` to control promoted listings
- use the guides to support SEO and educate visitors
- use the thank-you page for ad tracking
- use Firestore logs for searches, listing snapshots, leads, and chat conversations to understand audience intent and listing behavior

This manual should be enough to operate the site without touching the code for normal daily and weekly workflows.
