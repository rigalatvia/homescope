require('@next/env').loadEnvConfig(process.cwd());
require('../../tests/register-ts.cjs');
const fs=require('node:fs/promises');
const {DdfTrebFeedConnector}=require('../../lib/mls/connectors/DdfTrebFeedConnector');
const {normalizeListing}=require('../../lib/mls/normalize/normalizeListing');
const {eligibilityReason,newCampaign}=require('../../lib/social/policy');
const {selectPhotos}=require('../../lib/social/images');
const {renderCarousel}=require('../../lib/social/render');
(async()=>{
 const response=await fetch(process.env.DDF_TOKEN_URL,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'client_credentials',client_id:process.env.DDF_CLIENT_ID,client_secret:process.env.DDF_CLIENT_SECRET,scope:process.env.DDF_SCOPE||'DDFApi_Read'}),signal:AbortSignal.timeout(20000)});
 const auth=await response.json(); if(!auth.access_token)throw Error('Feed authentication failed');
 const url=new URL(process.env.DDF_LISTINGS_URL);url.searchParams.set('$top','5');url.searchParams.set('$filter',"(ListOfficeKey eq '282777' or ListOfficeKey eq '298485') and contains(City,'Toronto')");
 const res=await fetch(url,{headers:{Authorization:`Bearer ${auth.access_token}`},signal:AbortSignal.timeout(20000)});if(!res.ok)throw Error(`Feed query failed ${res.status}: ${JSON.stringify(await res.json()).slice(0,1000)}`);
 const data=await res.json();const connector=new DdfTrebFeedConnector();const now=new Date().toISOString();
 for(const row of data.value||[]){
  const raw=connector.mapDdfRecordToRawListing(row,0);const listing={...normalizeListing(raw,now),createdAt:now,updatedAt:now,lastSeenAt:now};
  const reason=eligibilityReason(listing);if(reason){console.log('Skipped candidate:',reason,listing.status,listing.hiddenReason,listing.municipality);continue;}
  process.env.SOCIAL_PHOTO_HOSTS=[...new Set(listing.images.map(x=>new URL(x).hostname))].join(',');
  const campaign=newCampaign(listing,now,true,true);
  const page=await fetch(campaign.property.url,{redirect:'error',signal:AbortSignal.timeout(20000)});const html=await page.text();if(!page.ok||!html.includes(new URL(campaign.property.url).pathname)){console.log('Skipped unavailable page',page.status);continue;}
  console.log('Photo source',process.env.SOCIAL_PHOTO_HOSTS,'count',listing.images.length); const photos=await selectPhotos(listing.images, async url=>{try{return await require('../../lib/social/images').downloadPhoto(url,process.env.SOCIAL_PHOTO_HOSTS.split(','));}catch(e){console.log(e.message);throw e;}});const slides=await renderCarousel(listing,photos);
  await fs.writeFile('tmp/social-preview/listing.json',JSON.stringify(listing,null,2));
  for(let i=0;i<slides.length;i++)await fs.writeFile(`tmp/social-preview/slide-${i+1}.jpg`,slides[i]);
  await fs.writeFile('tmp/social-preview/captions.json',JSON.stringify({instagram:campaign.instagram.caption,facebook:campaign.facebook.caption,firstComment:`Explore this property on HomeScope GTA:\n${campaign.property.url}`,photoHosts:process.env.SOCIAL_PHOTO_HOSTS},null,2));
  console.log(JSON.stringify({city:listing.municipality,officeKey:listing.listingOfficeKey,sourceSystem:listing.sourceSystem,photos:photos.length,slides:slides.length,publicUrl:campaign.property.url,photoHosts:process.env.SOCIAL_PHOTO_HOSTS}));return;
 }
 throw Error('No eligible preview in bounded sample');
})().catch(e=>{console.error(e.message);process.exitCode=1});





