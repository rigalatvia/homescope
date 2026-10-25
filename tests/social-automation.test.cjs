const test = require("node:test");
const assert = require("node:assert/strict");
const sharp = require("sharp");
const policy = require("../lib/social/policy");
const { MetaClient, advancePlatform, advanceFirstComment } = require("../lib/social/meta");
const { selectPhotos, allowedPhotoUrl } = require("../lib/social/images");
const { renderCarousel } = require("../lib/social/render");
const listing = {listingId:"toronto-board-ddf:123",sourceSystem:"toronto-board-ddf",listingOfficeKey:"282777",listingOfficeName:"RE/MAX METROPOLIS REALTY",mlsNumber:"C12345678",slug:"test-home-c12345678",status:"active",isVisible:true,permToAdvertise:true,municipality:"Toronto",price:900000,bedrooms:3,bathrooms:2,propertyType:"House",address:{fullAddress:"10 Example Street"},images:["https://photos.example/1.jpg","https://photos.example/2.jpg"],createdAt:"2026-10-23T12:00:00Z"};
const campaign = () => {const c=policy.newCampaign(listing,"2026-10-23T12:00:00Z",false);c.assets=listing.images;return c;};
const config={version:"v99.0",pageId:"100",instagramId:"200",token:"test",appId:"300",appSecret:"test"};
const save=async()=>{};
const ok=data=>new Response(JSON.stringify(data),{status:200});
function client(handler){return new MetaClient(config,async(url,init)=>handler(new URL(url).pathname.replace("/v99.0/",""),init,new URLSearchParams(init.body||"")));}

test("exact listing office identity, source scoping and exclusions",()=>{
 assert.equal(policy.eligibilityReason(listing),null);
 for(const key of ["298485","282777"])assert.equal(policy.isMetropolisRealtyListing({...listing,listingOfficeKey:key}),true);
 assert.equal(policy.isMetropolisRealtyListing({...listing,listingOfficeKey:"999",listingOfficeName:"RE/MAX METROPOLIS REALTY"}),false);
 assert.equal(policy.isMetropolisRealtyListing({...listing,sourceSystem:"other-feed"}),false);
 for(const name of ["RE/MAX Other Realty","Metropolis Realty","RE/MAX METROPOLIS REALTY EXTRA"])assert.equal(policy.matchesOfficeName(name),false);
 assert.equal(policy.matchesOfficeName("Re/Max Metropolis Realty, Brokerage"),true);
 for(const patch of [{status:"sold"},{isVisible:false},{socialRestricted:true},{permToAdvertise:false},{slug:""}])assert.ok(policy.eligibilityReason({...listing,...patch}));
 assert.equal(policy.campaignId(listing.listingId),policy.campaignId(listing.listingId));
});
test("public captions omit MLS, property URLs and listing-agent claims",()=>{
 const captions=policy.buildCaptions(listing,policy.campaignId(listing.listingId));
 for(const caption of Object.values(captions)){
  assert.doesNotMatch(caption,/MLS|C12345678|listing agent|my listing|https:\/\//i);
  assert.match(caption,/first comment/);
  assert.match(caption,/RE\/MAX METROPOLIS REALTY/);
 }
});
test("every new property is immediately eligible regardless of legacy limits or local hour",()=>{
 const now=new Date("2026-11-01T04:30:00.000Z");
 const legacy={...policy.DEFAULT_SETTINGS,dailyLimit:2,minimumHours:4,windowStart:9,windowEnd:20};
 for(let i=0;i<20;i++) assert.equal(policy.nextSlot(now,now.toISOString(),{"2026-11-01":100},legacy),now.toISOString());
 assert.equal(policy.DEFAULT_SETTINGS.dailyLimit,0);
 assert.equal(policy.DEFAULT_SETTINGS.minimumHours,0);
});
test("host allowlist rejects credentials, HTTP and deceptive hostnames",()=>{
 assert.throws(()=>allowedPhotoUrl("http://photos.example/a",["photos.example"]));
 assert.throws(()=>allowedPhotoUrl("https://user:pass@photos.example/a",["photos.example"]));
 assert.throws(()=>allowedPhotoUrl("https://photos.example.attacker.test/a",["photos.example"]));
 assert.equal(allowedPhotoUrl(listing.images[0],["photos.example"]).hostname,"photos.example");
});
test("distinct photos and adaptive carousel dimensions",async()=>{
 const a=await sharp({create:{width:1200,height:800,channels:3,background:"#eab"}}).jpeg().toBuffer();
 const b=await sharp({create:{width:1200,height:800,channels:3,background:"#abc"}}).jpeg().toBuffer();
 const small=await sharp({create:{width:200,height:200,channels:3,background:"#fff"}}).jpeg().toBuffer();
 const photos=await selectPhotos(["a","duplicate","broken","small","b"],async x=>{if(x==="broken")throw Error("unavailable");return x==="b"?b:x==="small"?small:a;});
 assert.equal(photos.length,2);
 await assert.rejects(selectPhotos(["a","duplicate"],async()=>a),/Fewer than two/);
 const slides=await renderCarousel(listing,photos);assert.equal(slides.length,4);
 for(const image of slides){const m=await sharp(image).metadata();assert.equal(m.width,1080);assert.equal(m.height,1350);}
});
test("Facebook creates one multi-photo post and one property-link comment",async()=>{
 const c=campaign();let photos=0,posts=0,comments=0;
 const api=client((path,init,body)=>{
  if(path==="100/photos"){photos++;assert.equal(body.get("published"),"false");return ok({id:"photo"+photos});}
  if(path==="100/feed"){posts++;assert.equal(JSON.parse(body.get("attached_media")).length,2);return ok({id:"fbpost"});}
  if(path==="fbpost/comments"){comments++;assert.match(body.get("message"),/https:\/\/homescopegta.ca\/listings\//);return ok({id:"comment"});}
  return ok({permalink_url:"https://www.facebook.com/fbpost"});
 });
 for(let i=0;i<5;i++)await advancePlatform(api,c,"facebook",save,save);
 assert.deepEqual([photos,posts,comments],[2,1,1]);assert.equal(c.facebook.firstComment.status,"published");
});
test("Instagram prepares children and parent then publishes exactly once",async()=>{
 const c=campaign();let children=0,parents=0,posts=0,comments=0;
 const api=client((path,init,body)=>{
  if(path.endsWith("content_publishing_limit"))return ok({data:[{quota_usage:0,config:{quota_total:100}}]});
  if(path==="200/media"){if(body.get("media_type")==="CAROUSEL"){parents++;return ok({id:"parent"});}children++;return ok({id:"child"+children});}
  if(path==="parent")return ok({status_code:"FINISHED"});
  if(path==="200/media_publish"){posts++;return ok({id:"igpost"});}
  if(path==="igpost/comments"){comments++;return ok({id:"comment"});}
  return ok({permalink:"https://www.instagram.com/p/test"});
 });
 for(let i=0;i<6;i++)await advancePlatform(api,c,"instagram",save,save);
 assert.deepEqual([children,parents,posts,comments],[2,1,1,1]);
});
test("ambiguous publication is reconciled without another POST",async()=>{
 const c=campaign();c.facebook.mediaIds=["a","b"];let posts=0;
 const api=client((path,init)=>{
  if(init.method==="POST"){posts++;throw Error("timeout");}
  return ok({data:[{id:"recovered",message:c.facebook.caption,created_time:new Date().toISOString(),permalink_url:"https://www.facebook.com/recovered"}]});
 });
 await advancePlatform(api,c,"facebook",save,save);assert.equal(c.facebook.status,"uncertain");
 c.facebook.retryAt=null;await advancePlatform(api,c,"facebook",save,save);
 assert.equal(posts,1);assert.equal(c.facebook.postId,"recovered");
});
test("uncertain comment read-back never repeats a POST, even when no match",async()=>{
 const c=campaign();c.facebook.status="published";c.facebook.postId="posted";let posts=0;
 const api=client((path,init)=>{if(init.method==="POST"){posts++;throw Error("timeout");}return ok({data:[]});});
 await advanceFirstComment(api,c,"facebook",save);
 for(let i=0;i<5;i++){c.facebook.firstComment.retryAt=null;await advanceFirstComment(api,c,"facebook",save);}
 assert.equal(posts,1);assert.equal(c.facebook.status,"published");assert.equal(c.facebook.firstComment.status,"uncertain");
 assert.equal(c.facebook.firstComment.retryAt,null);
});
test("comment reconciliation requires matching message and publishing account",async()=>{
 const c=campaign();c.instagram.status="published";c.instagram.postId="posted";
 c.instagram.firstComment={message:"property link",status:"uncertain",submittedAt:new Date().toISOString(),id:null,attempts:1,checks:0,retryAt:null,lastError:null};
 await advanceFirstComment(client(()=>ok({data:[{id:"wrong",text:"property link",from:{id:"stranger"}}]})),c,"instagram",save);
 assert.equal(c.instagram.firstComment.id,null);
 c.instagram.firstComment.retryAt=null;
 await advanceFirstComment(client(()=>ok({data:[{id:"correct",text:"property link",from:{id:"200"}}]})),c,"instagram",save);
 assert.equal(c.instagram.firstComment.id,"correct");
});
test("one platform failure and comment failure preserve successful publication",async()=>{
 const c=campaign();c.instagram.status="published";c.instagram.postId="ig";c.instagram.permalink="https://www.instagram.com/p/test";
 c.facebook.mediaIds=["a","b"];
 const api=client(()=>new Response(JSON.stringify({error:{code:190}}),{status:400}));
 await advancePlatform(api,c,"facebook",save,save);
 assert.equal(c.instagram.status,"published");assert.equal(c.facebook.status,"failed");assert.equal(c.facebook.retryAt,null);
 await advancePlatform(api,c,"instagram",save,save);
 assert.equal(c.instagram.status,"published");assert.equal(c.instagram.firstComment.status,"failed");
});
test("rate limiting has bounded retries and dry-run never calls transport",async()=>{
 const c=campaign();let calls=0;
 const api=client(()=>{calls++;return new Response(JSON.stringify({error:{code:4}}),{status:429});});
 for(let i=0;i<5;i++){c.facebook.retryAt=new Date(Date.now()-1000).toISOString();await advancePlatform(api,c,"facebook",save,save);}
 assert.equal(c.facebook.retries,5);assert.equal(c.facebook.retryAt,null);
 const before=calls;c.dryRun=true;
 await assert.rejects(advancePlatform(api,c,"instagram",save,save),/Dry-run/);
 await assert.rejects(advanceFirstComment(api,c,"facebook",save),/Dry-run/);
 assert.equal(calls,before);
});


const Module=require("node:module");
const records=new Map();
let txTail=Promise.resolve();
const snapshot=(key)=>({id:key.split("/").at(-1),exists:records.has(key),data:()=>records.get(key),get:field=>records.get(key)?.[field]});
function reference(path){return {path,id:path.split("/").at(-1),get:async()=>snapshot(path),update:async data=>{const current=records.get(path);for(const [key,value] of Object.entries(data)){if(value?.constructor?.name==="DeleteTransform")delete current[key];else current[key]=value;}},set:async(data,opts)=>records.set(path,opts?.merge?{...records.get(path),...data}:structuredClone(data)),create:async data=>{if(records.has(path))throw Object.assign(Error("exists"),{code:6});records.set(path,structuredClone(data));}};}
function query(collection,filters=[],orders=[],cursor=null,max=Infinity){
 return {
  doc:id=>reference(collection+"/"+id),
  where:(field,op,value)=>query(collection,[...filters,[field,op,value]],orders,cursor,max),
  orderBy:field=>query(collection,filters,[...orders,typeof field==="string"?field:"__name__"],cursor,max),
  startAfter:(...values)=>query(collection,filters,orders,values,max),
  limit:n=>query(collection,filters,orders,cursor,n),select:()=>query(collection,filters,orders,cursor,max),
  get:async()=>{
   let rows=[...records.keys()].filter(k=>k.startsWith(collection+"/")).map(snapshot);
   const value=(row,key)=>key==="__name__"?row.id:row.get(key);
   rows=rows.filter(row=>filters.every(([key,op,v])=>row.get(key)!==undefined&&(op==="<="?row.get(key)<=v:op===">"?row.get(key)>v:row.get(key)===v)));
   const compare=(a,b)=>{for(let i=0;i<a.length;i++){if(a[i]!==b[i])return a[i]<b[i]?-1:1;}return 0;};
   rows.sort((a,b)=>compare(orders.map(k=>value(a,k)),orders.map(k=>value(b,k))));
   if(cursor)rows=rows.filter(row=>compare(orders.map(k=>value(row,k)),cursor)>0);
   rows=rows.slice(0,max);return{docs:rows,size:rows.length};
  }
 };
}
const fakeDb={
 collection:name=>query(name),
 batch:()=>{const writes=[];return{set:(ref,data,opts)=>writes.push(()=>ref.set(data,opts)),commit:async()=>{for(const write of writes)await write();}};},
 runTransaction:fn=>{const operation=txTail.then(()=>fn({get:ref=>ref.get(),set:(ref,data)=>records.set(ref.path,structuredClone(data)),delete:ref=>records.delete(ref.path)}));txTail=operation.catch(()=>{});return operation;}
};
const originalLoad=Module._load;
Module._load=function(name,...args){if(name==="@/lib/firebase/admin")return{getFirebaseAdminFirestore:()=>fakeDb};return originalLoad.call(this,name,...args);};
const store=require("../lib/social/store");
Module._load=originalLoad;
test("activation excludes legacy IDs and discovery creates one job across repeated syncs",async()=>{
 records.clear();const activatedAt="2026-10-22T12:00:00.000Z";
 const legacy={...listing,listingId:"legacy",createdAt:"2026-01-01T00:00:00.000Z",listingOfficeName:null,listingOfficeKey:null};
 records.set("listings/legacy",legacy);
 const settings={...policy.DEFAULT_SETTINGS,activatedAt};
 await store.withSocialLock(lock=>store.discover(settings,lock));
 assert.equal(records.get("settings/socialAutomation").baselineComplete,true);
 assert.ok(records.has("socialActivationExclusions/"+policy.campaignId("legacy")));
 // Delete/reimport legacy and discover a genuinely new property.
 records.set("listings/legacy",{...listing,listingId:"legacy",socialDiscoveryPendingAt:"2026-10-23T12:00:00.000Z",socialDiscoveredAt:"2026-10-23T12:00:00.000Z"});
 records.set("listings/new",{...listing,listingId:"new",socialDiscoveryPendingAt:"2026-10-23T12:00:01.000Z",socialDiscoveredAt:"2026-10-23T12:00:01.000Z"});
 const ready={...settings,baselineComplete:true};
 await store.withSocialLock(lock=>store.discover(ready,lock));
 await store.withSocialLock(lock=>store.discover(ready,lock));
 assert.equal([...records.keys()].filter(k=>k.startsWith("propertySocialPosts/")).length,1);
 assert.equal(records.get("propertySocialPosts/"+policy.campaignId("new")).listingId,"new");
 records.set("listings/late",{...listing,listingId:"late",socialDiscoveredAt:"2026-10-22T13:00:00.000Z",socialDiscoveryPendingAt:"2026-10-22T13:00:00.000Z"});
 await store.withSocialLock(lock=>store.discover(ready,lock));
 assert.ok(records.has("propertySocialPosts/"+policy.campaignId("late")));
});
test("concurrent workers are excluded and expired lock cannot save",async()=>{
 records.clear();let release,entered;const enteredPromise=new Promise(r=>entered=r);
 const held=store.withSocialLock(async lock=>{entered();await new Promise(r=>release=r);records.set("settings/socialWorkerLease",{owner:"another",until:"9999-12-31T00:00:00.000Z"});await assert.rejects(lock.save(campaign()),/expired/);});
 await enteredPromise;
 await assert.rejects(store.withSocialLock(async()=>{}),/busy/);release();await held;
 assert.equal(records.get("settings/socialWorkerLease").owner,"another");
});
