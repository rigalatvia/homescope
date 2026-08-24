import type { Metadata } from "next";
import Link from "next/link";
import { Bell, FileCheck2, FileSignature, Home, KeyRound, Search, UserRoundCheck } from "lucide-react";
import { Breadcrumbs } from "@/components/guides/breadcrumbs";
import { FAQSection } from "@/components/guides/faq-section";
import { RentalHelpForm, RentalHero } from "@/components/guides/rental-application-experience";
import { ListingCard } from "@/components/listings/listing-card";
import { SITE_CONFIG } from "@/config/site";
import { getPublicListings } from "@/lib/listings/service";
import { buildPageMetadata } from "@/lib/seo/metadata";

const path = "/guides/rental-application-ontario";
const rentalsUrl = "/listings?transactionType=lease&sort=newest";
const description = "Download Ontario Rental Application Form 410, prepare your supporting documents, search current GTA rentals and create alerts for new matching listings.";
const breadcrumbs = [{ label: "Home", href: "/" }, { label: "Guides", href: "/guides" }, { label: "Ontario Rental Application Form 410 PDF" }];
const faqItems = [
  { question: "What is Ontario Rental Application Form 410?", answer: "Form 410 is a residential rental application commonly used in Ontario to collect applicant details, rental history, employment information, references and consent signatures." },
  { question: "Is Form 410 a residential lease?", answer: "No. Form 410 is an application, not the tenancy agreement that sets the final lease terms." },
  { question: "What information does a rental application request?", answer: "It commonly requests identity and contact details, current and previous addresses, employment information, rental history, references, financial information and signatures." },
  { question: "What documents may support an Ontario rental application?", answer: "A landlord may request identification, proof of income, employment confirmation, references, rental history, and financial or credit-related documents. Requirements differ." },
  { question: "Does completing Form 410 guarantee approval?", answer: "No. Completing an application does not guarantee approval. A landlord reviews the application and any supporting information for the specific rental." },
  { question: "What is the difference between Form 410 and the Ontario Standard Lease?", answer: "Form 410 is used to apply for a rental. The Ontario Standard Lease is the tenancy agreement used to record the terms after an application is accepted, where applicable." },
  { question: "Where can I search for rentals in the GTA?", answer: "HomeScope GTA's rental search shows active lease listings and lets you filter by city, monthly price, bedrooms, property type and school." },
  { question: "How can I receive alerts for new rental listings?", answer: "Choose rental criteria in the alert form on this page, sign in to your HomeScope account, and select instant, daily or weekly notifications." }
];

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPageMetadata({ title: "Ontario Rental Application Form 410 PDF | HomeScope GTA", description, path, type: "article" });

export default async function RentalApplicationOntarioPage() {
  const listings = await getPublicListings({ transactionType: "lease", sort: "newest", page: 1, pageSize: 6 });
  const url = `${SITE_CONFIG.baseUrl}${path}`;
  const articleSchema = { "@context":"https://schema.org", "@type":"Article", headline:"Ontario Rental Application Form 410 PDF", description, mainEntityOfPage:url, author:{"@type":"Organization",name:"HomeScope GTA"}, publisher:{"@type":"Organization",name:"HomeScope GTA"} };
  const breadcrumbSchema = { "@context":"https://schema.org", "@type":"BreadcrumbList", itemListElement:breadcrumbs.map((item,index)=>({"@type":"ListItem",position:index+1,name:item.label,item:item.href?`${SITE_CONFIG.baseUrl}${item.href}`:url})) };
  const faqSchema = { "@context":"https://schema.org", "@type":"FAQPage", mainEntity:faqItems.map(item=>({"@type":"Question",name:item.question,acceptedAnswer:{"@type":"Answer",text:item.answer}})) };

  return <main className="site-container py-10 sm:py-14">
    {[articleSchema,breadcrumbSchema,faqSchema].map((schema,index)=><script key={index} type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}} />)}
    <Breadcrumbs items={breadcrumbs}/>
    <div className="mt-6"><RentalHero /></div>

    <section className="mt-14"><SectionHeading title="From application form to the right rental"/><div className="mt-6 grid gap-5 md:grid-cols-3">{[
      [FileCheck2,"Prepare your application","Review Form 410 and organize the documents you may need before applying."],
      [Search,"Find matching rentals","Search by city, price, bedrooms, property type or school."],
      [KeyRound,"Get help applying","Ask questions or request a private showing when you find the right home."]
    ].map(([Icon,title,copy],index)=><article key={String(title)} className="rounded-2xl border border-brand-100 bg-white p-6 shadow-soft"><span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Icon className="h-5 w-5"/></span><p className="mt-4 text-xs font-bold uppercase tracking-widest text-brand-500">Step {index+1}</p><h3 className="mt-2 text-xl font-semibold text-brand-900">{String(title)}</h3><p className="mt-2 leading-7 text-brand-700">{String(copy)}</p></article>)}</div></section>

    <section className="mt-14" aria-labelledby="rentals-heading"><SectionHeading id="rentals-heading" title="GTA rentals you can explore now" copy="Start with currently available rentals, then save your search to hear about new matches."/>
      {listings.items.length ? <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{listings.items.map(listing=><ListingCard key={listing.id} listing={listing} returnTo={path}/>)}</div>:<div className="mt-6 rounded-2xl border border-brand-100 bg-white p-8 text-center text-brand-700">No active rental listings are available right now. Create an alert to hear when new matches appear.</div>}
      <Link href={rentalsUrl} className="mt-6 inline-flex min-h-12 items-center rounded-lg bg-brand-900 px-5 py-3 font-semibold text-white">See All GTA Rentals</Link>
    </section>

    <section className="mt-14 rounded-[2rem] bg-brand-900 p-7 text-white sm:p-10"><p className="text-sm font-bold uppercase tracking-widest text-brand-200">New Listing Alerts</p><h2 className="mt-3 font-heading text-3xl sm:text-4xl">Don&apos;t rebuild the same rental search every day</h2><p className="mt-4 max-w-3xl leading-7 text-brand-100">Choose your city, monthly rent, bedrooms and property type once. HomeScope can notify you when a new matching rental appears.</p><ul className="mt-6 grid gap-3 sm:grid-cols-2">{["Instant, daily or weekly alerts","Save promising rentals","Keep your shortlist organized","Request private showings"].map(item=><li key={item} className="flex items-center gap-3"><Bell className="h-5 w-5 text-brand-200"/>{item}</li>)}</ul><div className="mt-7 flex flex-wrap items-center gap-5"><a href="#rental-alert" className="inline-flex min-h-12 items-center rounded-lg bg-white px-5 py-3 font-semibold text-brand-900">Set Up My Rental Alert</a><a href="#alerts-explained" className="font-semibold underline underline-offset-4">See How Alerts Work</a></div><p id="alerts-explained" className="mt-5 text-sm leading-6 text-brand-200">Saved-search alerts use the rental criteria you choose and can notify your signed-in account at the frequency you select.</p></section>

    <section className="mt-14"><p className="text-sm font-bold uppercase tracking-widest text-brand-600">Rental Application Checklist</p><SectionHeading title="Prepare before you apply" copy="Requirements can differ, but organizing commonly requested information in advance can make the application process easier."/><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{["Identification","Employment information","Proof of income","Rental history","References","Supporting financial or credit-related documents when requested","Funds for applicable deposits"].map(item=><div key={item} className="flex gap-3 rounded-2xl border border-brand-100 bg-white p-5 shadow-soft"><FileCheck2 className="h-5 w-5 shrink-0 text-brand-600"/><p className="font-semibold text-brand-900">{item}</p></div>)}</div><p className="mt-5 text-brand-700">For a more detailed checklist, read the <Link href="/guides/lease-documents" className="font-semibold text-brand-900 underline">documents needed to rent guide</Link> or review the <Link href="/guides/leasing" className="font-semibold text-brand-900 underline">Ontario leasing guide</Link>.</p></section>

    <section className="mt-14"><p className="text-sm font-bold uppercase tracking-widest text-brand-600">Personal Rental Help</p><SectionHeading title="Want help finding the right rental?" copy="Tell us what you are looking for. A GTA real-estate professional can help you explore available options and arrange private showings."/><RentalHelpForm/></section>

    <article className="mt-14 rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-10"><p className="text-sm font-bold uppercase tracking-widest text-brand-600">Form 410 Information</p><h2 className="mt-3 font-heading text-3xl text-brand-900">Understanding Ontario Rental Application Form 410</h2><div className="mt-7 grid gap-7 md:grid-cols-2">
      <Info icon={FileSignature} title="What Form 410 is">Form 410 is a residential rental application resource commonly used in Ontario. It helps an applicant provide information for a landlord or listing representative to review. It is not a residential lease and does not guarantee approval.</Info>
      <Info icon={UserRoundCheck} title="Information requested on the form">The form commonly asks for applicant details, current and previous addresses, rental history, employment, references, banking or financial information, vehicle details, occupants, consent and signatures.</Info>
      <Info icon={FileCheck2} title="How to prepare before applying">Read the complete form, confirm reference details, and organize identification, proof of income, employment confirmation, rental history, and any financial or credit-related documents requested for the specific application.</Info>
      <Info icon={Home} title="Supporting rental documents">Supporting requirements differ by landlord and property. Share sensitive information only through an appropriate, trusted process and understand why it is being requested before providing it.</Info>
    </div><p className="mt-8 rounded-xl bg-brand-50 p-5 text-sm leading-7 text-brand-800"><strong>This resource is provided for general informational purposes and is not legal advice.</strong> Rental requirements can differ. Confirm that you are using the appropriate documents for your situation.</p></article>
    <FAQSection items={faqItems}/>
  </main>;
}

function SectionHeading({title,copy,id}:{title:string;copy?:string;id?:string}) { return <div><h2 id={id} className="mt-2 font-heading text-3xl text-brand-900 sm:text-4xl">{title}</h2>{copy?<p className="mt-3 max-w-3xl text-base leading-7 text-brand-700 sm:text-lg">{copy}</p>:null}</div>; }
function Info({icon:Icon,title,children}:{icon:typeof FileSignature;title:string;children:React.ReactNode}) { return <section><Icon className="h-6 w-6 text-brand-600"/><h3 className="mt-3 text-xl font-semibold text-brand-900">{title}</h3><p className="mt-2 leading-7 text-brand-700">{children}</p></section>; }
