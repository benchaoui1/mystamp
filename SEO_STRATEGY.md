# MyStamp — Technical SEO & Content Strategy
**Prepared by:** Senior Technical SEO Strategist
**Scope:** Custom self-inking company stamps — Dubai & UAE
**Status:** STRATEGY & PROPOSED COPY ONLY — awaiting explicit approval before implementation
**Evidence base:** competitor.xlsx, uae_stamp_websites.xlsx, Desco SEMrush PDF, SEMrush screenshots (company_stamp.png, stamp_maker.png, competitor.png), full crawl of 15 MyStamp HTML pages

---

## HONEST ASSESSMENT (read first)

No one can guarantee rankings. What the evidence *does* support: the top competitor (descoonline.com) wins on **domain age + local citations + a single well-aged URL**, not on content quality — its ranking page is thin (~120 words), has an empty FAQ, and no interactive tool. That is a genuinely beatable profile **on relevance and usefulness**, but Desco's 78% traffic share reflects authority signals (backlinks, GBP footprint, age) that content alone will not overcome in weeks. Realistic outcome: MyStamp can become the **most useful and technically cleanest** result in this niche within 90 days, and can win the **lower-KD long-tail and tool/near-me clusters first**, while the head term "company stamp" is a 3–6 month contest that depends heavily on the Local SEO and backlink work in Phase 5–6, not just on-page copy.

Two things will cap results regardless of copy quality, and both are outside this document's editing scope:
1. **The domain must actually be live at https://mystamp.ae** (currently the canonical target). Until DNS points to the deployed site, none of this ranks.
2. **A verified Google Business Profile** is the single highest-leverage asset for every "near me" and "Dubai" term. Without it, near-me rankings are effectively capped.

---

# PHASE 1 — EVIDENCE-BASED AUDIT

## 1.1 Page inventory & SEO table

| URL | Current Title (short) | Current H1 | Words | Intent | Current primary kw | **Recommended primary kw** | Secondary kws | Cannibalisation risk | Action |
|---|---|---|---|---|---|---|---|---|---|
| **index.html** | Company Stamp Dubai from AED 99 \| 4-Hour Express | Company stamps, made in Dubai in under 4 hours | 1,247 | Commercial / local | company stamp dubai | **company stamp** (+ company stamp Dubai, stamp maker in Dubai) | dubai stamp maker, company stamp maker near me, stamp maker near me, company stamp UAE | **HIGH** — competes with company-stamps.html for "company stamp" | **Make the primary commercial authority.** Expand to ~1,600–1,900 words, own head + local cluster |
| **company-stamps.html** | Company Stamp Dubai — Design Yours in 2 Min | Your official company stamp, ready in hours | 2,169 | Commercial / product info | company stamp dubai | **company stamp types / shapes** (round/oval/rectangle/square company stamp, company seal stamp, stamp sizes) | company seal stamp, round company stamp, stamp size, company stamp sample | **HIGH** vs index (both chase "company stamp Dubai") | **Re-focus to product/shape/size hub.** Strip head-term & local targeting; point those signals to homepage |
| **company-stamp-maker.html** | Company Stamp Maker Online — Free Live Designer | Design your company stamp and order it — all online | 1,601 | Tool / transactional | company stamp maker online | **company stamp maker / online stamp maker** (tool cluster) | company stamp generator, online stamp maker free, make a company stamp, stamp maker online | **MEDIUM** — near-me phrases here overlap homepage | **Keep tool cluster only.** Remove near-me/Dubai-maker phrasing that belongs to homepage. Tool now lives on index → see cannibalisation note below |
| **signature.html** | Sign & Verify — Signature Verification | Add your signature | 399 | Order workflow | (none) | **noindex the workflow;** recommend a *separate* signature-stamp SEO page later | signature stamp, self-inking signature stamp | Low | **Add `noindex,follow`.** It's an order step, not a landing page |
| **about-us.html** | About MyStamp \| Dubai's Fastest Custom Company Stamp Studio | We make the stamp behind every official signature | 592 | Brand / EEAT | brand | **brand + EEAT** (GLS PRO, Deira studio) | company stamp studio Dubai | Low | Keep. Tighten NAP consistency, add sameAs |
| **contact-us.html** | Contact Us · MyStamp.ae | Let's talk | 340 | Local / support | contact | **contact + store location** (Deira) | stamp shop Deira, visit stamp maker Dubai | Low | **Add canonical + LocalBusiness schema.** Strong near-me support page |
| **checkout.html** | Checkout — Review & Confirm | (none) | 299 | Transactional | — | — | — | noindex,follow ✅ already | Keep noindex. Add canonical to self |
| **payment-success / payment-failed** | — | (none) | 40–47 | Transactional | — | — | — | noindex,nofollow ✅ | Keep |
| **privacy / cookie / terms / refund / shipping / cancellation** | Policy titles | Policy H1s | 266–521 | Legal | — | — | — | Low | **Add canonicals; keep indexable** (trust signals). No keyword targeting |

## 1.2 Critical technical issues found

**A. Cannibalisation (highest priority)**
- `index.html` and `company-stamps.html` **both target "company stamp / company stamp Dubai"** with near-identical commercial intent. Two URLs chasing the same primary keyword split link equity and confuse Google's canonical selection. **Rule you set: never distribute the same primary keyword across multiple URLs.** → Homepage owns the head + local commercial cluster; company-stamps.html must be re-pointed to **product types / shapes / sizes / samples**.
- `company-stamp-maker.html` previously duplicated the entire configurator that lives on `index.html`. That duplication was already removed in the current build (the maker page now shows a static showcase and links to `index.html#configurator`). **This creates a new strategic question (see 1.3).**

**B. Fabricated / unverifiable structured-data claims (compliance risk — you explicitly prohibited these)**
- `index.html` + `company-stamp-maker.html`: `AggregateRating 5.0, reviewCount 41`
- `company-stamps.html`: `AggregateRating 4.9, reviewCount 312` (appears 5×, incl. on 4 Product blocks)
- Visible copy: **"10,000+ stamps delivered" / "10k+"** (index, maker, company-stamps), **"312"**, **"thousands of…"**
- **These must be removed or replaced with verifiable facts.** Fake AggregateRating is both against your rules and a Google structured-data violation that can trigger manual action. If you have *real* Google reviews, we surface the real count; if not, we remove the rating markup entirely and use non-numeric trust signals.

**C. Unsupported acceptance claims**
- "accepted by UAE banks, government departments and clients" (company-stamps.html, ×2). You prohibited claiming universal bank/government acceptance without an official source. → Soften to defensible phrasing (e.g. "designed to meet the format UAE businesses use for official documents") unless you can cite a source.

**D. Delivery-fee leakage on marketing pages (you prohibited this)**
- `company-stamps.html` exposes **"AED 25 to Dubai… AED 30 to Abu Dhabi…"** and **"standard delivery is free" / "delivery is free on 2+ stamps."** Both violate your rules (no fees on marketing pages; no free-delivery claim). → Remove all fee lines and free-delivery language from marketing/SEO pages; fees stay in checkout only.

**E. Missing canonicals**
- Missing on: contact-us, signature, checkout, all 6 policy pages, cancellation. → Add self-referencing canonicals everywhere.

**F. Robots gaps**
- `signature.html` is indexable but is an order workflow → should be `noindex,follow`.
- Policy pages have no robots tag (defaults to index — acceptable, keep).

**G. Sitemap**
- **No sitemap.xml or robots.txt found in the folder.** → Create both. Sitemap should list only indexable canonical URLs (exclude checkout, payment-*, signature).

**H. Internal-link / fragment integrity**
- `company-stamps.html` links to `index.html?shape=circle#configurator`, `?shape=oval`, `?shape=rect`, `?shape=square`. Confirm the homepage configurator reads these params (it does per prior build). If not, these are broken UX fragments. **Verify during implementation.**
- No broken `.html` targets detected — all internal hrefs resolve to existing files.

**I. LocalBusiness data consistency**
- `index.html` LocalBusiness + `about-us.html` Organization + `company-stamp-maker.html` LocalBusiness all assert MyStamp. **NAP is not yet consistent across schema** (telephone present, but address is "Deira, Dubai" generically). You require: distinguish the **Deira store** (customer-facing) from the **GLS PRO F.Z.E legal registered address**. → Standardise one canonical NAP block; use `LocalBusiness` for the Deira store and `Organization` (legal entity GLS PRO) with the registered address, linked via `parentOrganization`/`sameAs`.

## 1.3 Strategic decision required: the "maker" page

Per your Phase-3 rule: *"company-stamp-maker.html: online tool keywords only **if the real interactive tool exists on this URL**. If the tool exists only on the homepage, recommend consolidation or redirect instead of creating another competing landing page."*

**Evidence:** The real interactive configurator currently lives on **index.html**. The maker page now only *showcases* it and links across. That makes company-stamp-maker.html a **near-doorway page** for tool keywords without hosting the tool — exactly the risk your brief warns against.

**Two clean options (your call):**
- **Option A (recommended): Move/duplicate the real interactive configurator onto `company-stamp-maker.html`** so the tool physically lives there, and let that URL own the **tool cluster** (stamp maker online, online stamp maker, company stamp generator). Homepage keeps a compact configurator teaser that deep-links to it. This gives two genuinely distinct pages: homepage = commercial/local authority; maker = the tool. No doorway risk.
- **Option B: Consolidate** — 301-redirect `company-stamp-maker.html` → `index.html#configurator`, and let the homepage target the tool cluster as a secondary theme. Fewer URLs, simplest, but you lose a dedicated tool-intent ranking target.

I recommend **Option A** because the tool cluster (stamp maker online 1,000, online stamp maker 390, generator 110) is high-volume and the interactive tool is your single biggest differentiator vs every competitor. But A requires moving interactive code, which is outside the "copy-only" edit scope — **so it needs your explicit sign-off as a structural exception.**

---

# PHASE 2 — COMPETITOR GAP ANALYSIS

**Confirmed from supplied files** (traffic/keywords/share) vs **assumptions needing live SERP check** are labelled.

| Keyword (vol / KD) | Who ranks (per your brief + files) | Ranking URL | Why it ranks | What it's missing | How MyStamp wins |
|---|---|---|---|---|---|
| **company stamp** (1,000 / 13) | descoonline | /rubber-stamp | Aged domain, strong local citations, exact-ish match, 78% share | Thin (~120 words), empty FAQ, no tool, no shapes/sizes depth, no schema on-page | Homepage: richer commercial page + real tool + verifiable trust + clean schema. *Assumption: needs backlink/GBP parity — verify live.* |
| **stamp maker near me** (1,300 / 15) | descoonline #1 | /rubber-stamp | GBP + citations drive local pack; page is generic | No booking/instant order, no live tool, no store-page signals | GBP + Deira store page (contact-us) + homepage near-me section + LocalBusiness schema |
| **company stamp maker near me** (320 / 10) | descoonline #1 | /rubber-stamp | Same local footprint | Same gaps | Same as above; lowest-KD near-me → early win target |
| **company stamp near me** (140 / 9) | *verify live* | — | Local intent | — | Homepage near-me block + GBP; KD 9 = easiest near-me |
| **stamp maker in Dubai** (260 / 19) | descoonline | /rubber-stamp | Geo + age | No specialised stamp UX | Homepage geo section, store citations |
| **Dubai stamp maker** (210 / 20) | descoonline | /rubber-stamp | Geo + age | — | Homepage; single geo focus |
| **company stamp UAE / UAE company stamp** (110/13, 90/7) | descoonline | /rubber-stamp | Country match | Thin | Homepage; KD 7 (UAE company stamp) = easy early win |
| **stamp maker online** (1,000 / 47) | stampmakers.ae (412 kws) | site tool page | Has a *free online tool* | Tool exports art only; no integrated order+pay; general (ice/wax/heat mixed) | Maker page (Option A) with real tool **+ order & pay in one flow** |
| **online stamp maker free** (260 / 38) | stampmakers.ae | tool page | "free" tool matches intent | Same limitation | Maker page: "free to design, pay only to order" framing |
| **company stamp generator** (110 / 33) | *verify live* | — | Generator intent | — | Maker page owns "generator" term with the live tool |
| **self inking stamps** (170 / 2) | multiple | various | KD 2 — trivial | Often generic | Any page; near-free win — put on company-stamps.html shapes hub |
| **company seal stamp** (90 / 26) | descoonline / others | — | — | — | company-stamps.html (product/seal section) |
| **stamp size / stamp design** (110/16, 320/22) | print shops | guides | Informational depth | Thin UAE-specific guidance | Supporting guide pages (Phase 3) |
| **rubber stamp** (390 / 21) | descoonline (URL literally /rubber-stamp) | /rubber-stamp | Exact URL match | Company-stamp specialisation weak | company-stamps.html secondary; don't over-target (broader intent) |

**Competitor profiles (from competitor.xlsx):**
- **descoonline.com/rubber-stamp** — 763 traffic / 71 kws / 78% share → *authority play, thin content.* Beat on usefulness + tool; match on local.
- **stampmakers.ae** — 343 / **412 kws** → *breadth play.* They rank for many tool/long-tail terms via a free tool. Our edge: order+pay integration.
- **dlxprint.com/stamps-dubai.html** — 337 / 110 → general Dubai print shop; stamps a sub-page.
- **companyrubberstamp.com** — 324 / 239 → keyword breadth, generic.
- **pinnaclestamp.com** — 290 / 154 → moderate.
- **companystampmaker.ae** — 86 / 259 → many kws, low traffic (weak authority) — a breadth target we can outrank on specific commercial terms.

**Confirmed evidence:** traffic, kw counts, share (from your files). **Requires live SERP verification:** exact current position of each URL per keyword, local-pack composition for near-me terms, and Desco's backlink profile. On-page copy cannot substitute for that verification.

---

# PHASE 3 — FINAL URL & KEYWORD MAP

### 1) `index.html` — PRIMARY COMMERCIAL / LOCAL AUTHORITY
- **Primary:** company stamp
- **Secondary (3–8):** company stamp Dubai, stamp maker in Dubai, Dubai stamp maker, company stamp maker near me, stamp maker near me, company stamp UAE, company stamp near me
- **Intent:** commercial + local
- **Title (rec):** `Company Stamp Dubai — Custom Self-Inking Stamps from AED 99 | MyStamp`
- **Meta:** `Order a custom company stamp in Dubai from AED 99. Design your self-inking stamp online, preview it live, and collect from our Deira studio or get delivery across the UAE. Round, oval, rectangle & square.`
- **H1:** `Custom company stamps in Dubai — designed online, made for your business`
- **H2/H3:** (see Phase 4 outline)
- **FAQ:** "How much is a company stamp in Dubai?" / "Where is your stamp shop?" / "How fast can I get one?" / "What do I need to order?" / "Which shape should I choose?"
- **Internal links (anchor → target):** "design your stamp online" → index #configurator (or maker if Option A); "explore stamp shapes & sizes" → company-stamps.html; "visit our Deira studio" → contact-us.html; "about GLS PRO / MyStamp" → about-us.html
- **Schema:** Organization (GLS PRO) + LocalBusiness (Deira store) + WebSite + FAQPage + Product/Offer (price 99, **no AggregateRating unless real reviews**)
- **Remove:** duplicate "company stamp Dubai" head-term saturation that also lives on company-stamps.html; "10k+" claim; delivery-fee/free-delivery lines
- **Retain:** hero configurator teaser, 4-hour messaging (if truthful), Deira location

### 2) `company-stamps.html` — PRODUCT TYPES / SHAPES / SIZES HUB
- **Primary:** company stamp types (shapes) — anchored by "round/oval/rectangle/square company stamp"
- **Secondary:** company seal stamp, self inking stamps, stamp size, company stamp sample, stamp design
- **Intent:** commercial-investigational (choosing a product)
- **Title (rec):** `Company Stamp Types — Round, Oval, Rectangle & Square Self-Inking Stamps | MyStamp`
- **Meta:** `Compare company stamp shapes and sizes — round, oval, rectangle and square self-inking stamps. See samples, standard sizes and what goes on a UAE company seal, then design yours online.`
- **H1:** `Company stamp shapes, sizes & samples`
- **FAQ:** "What size is a standard company stamp?" / "Round vs oval — which to choose?" / "What is a company seal stamp?" / "Can I see a company stamp sample?"
- **Internal links:** each shape → index #configurator with shape param; "how much does it cost / order" → index.html; "use the online maker" → maker page
- **Schema:** Product (per shape) + Offer (99) + BreadcrumbList + FAQPage + HowTo (how to design) — **remove reviewCount 312**
- **Remove:** head-term "company stamp Dubai" targeting (→ homepage), all delivery-fee & free-delivery lines, "accepted by UAE banks/government" absolute claim, fabricated 312 rating, "10k+"
- **Retain:** the 4 shape sections, What-is content, size guidance, FAQ (re-scoped), glowing-border design

### 3) `company-stamp-maker.html` — ONLINE TOOL CLUSTER
- **Condition:** valid **only under Option A** (real tool moved here). Under Option B, 301 → index #configurator.
- **Primary:** company stamp maker (+ stamp maker online)
- **Secondary:** online stamp maker, online stamp maker free, company stamp maker online free, company stamp generator, make a company stamp online
- **Intent:** tool / transactional
- **Title (rec):** `Company Stamp Maker Online — Free Live Designer, Order in Dubai | MyStamp`
- **Meta:** `Use our free company stamp maker: design your stamp online, preview it live, then order and pay in one place. Round, oval, rectangle & square. Made in Dubai from AED 99.`
- **H1:** `Free online company stamp maker`
- **FAQ:** "Is the stamp maker free?" / "Can I order the physical stamp here?" / "Can I add Arabic + English?" / "Do I need design software?"
- **Internal links:** "compare shapes & sizes" → company-stamps.html; "collect in Deira / delivery" → contact-us.html
- **Schema:** WebApplication (the tool) + Service + FAQPage — **remove reviewCount 41**
- **Remove (per your rule):** near-me / "company stamp maker Dubai / near me" phrasing that belongs to homepage; keep strictly tool-cluster
- **Retain:** generator explainer, comparison table, showcase

### 4) `signature.html` — ORDER WORKFLOW
- **Action:** `noindex, follow`. It's a signature *capture* step, not content.
- **Separate future page (recommended):** `signature-stamp.html` targeting **signature stamp** (140/26) + "self-inking signature stamp" — an SEO landing page distinct from the workflow. (Build in Phase 3 of roadmap, not now.)

### 5) Supporting guides (new, build in roadmap — informational cluster)
One primary keyword each, no overlap:
- `guide/company-stamp-requirements-uae` → "what do you need to make a company stamp in UAE" (trade licence, Emirates ID) — informational EEAT
- `guide/company-stamp-size-guide` → **stamp size** (110/16)
- `guide/company-stamp-samples` → **company stamp sample** (40/12)
- `guide/what-goes-on-a-company-stamp` → info required on a UAE stamp
- `guide/round-vs-oval-vs-rectangle` → shape comparison (links back to company-stamps.html)
Each links up to its commercial parent (company-stamps.html / homepage). This builds topical authority without doorway pages.

---

# PHASE 4 — HOMEPAGE CONTENT BRIEF (the money page)

### 1) Three title options (with justification)
1. `Company Stamp Dubai — Custom Self-Inking Stamps from AED 99 | MyStamp`
   *Head kw first + geo + price + brand. Price in title lifts CTR for commercial queries.*
2. `Company Stamp Maker in Dubai — Design & Order Online from AED 99 | MyStamp`
   *Captures "company stamp" + "in Dubai" + tool intent in one line; strong for blended SERPs.*
3. `Custom Company Stamps in Dubai & UAE — Made in Hours | MyStamp`
   *Leads with product + dual geo (Dubai/UAE) + speed hook. Best if "made in hours" is truthful.*
**Recommended: #1** (cleanest head-term + geo + price + brand within ~60 chars).

### 2) Three meta descriptions
1. `Order a custom company stamp in Dubai from AED 99. Design your self-inking stamp online, preview it live, and collect from our Deira studio or get UAE delivery. Round, oval, rectangle & square.`
2. `MyStamp makes custom company stamps in Dubai — self-inking, laser-engraved, from AED 99. Design online, see a live preview, and order in minutes. Studio in Deira, delivery across the UAE.`
3. `Need a company stamp in Dubai? Design yours online in minutes, preview the exact impression, and order from AED 99. Self-inking round, oval, rectangle & square stamps. Made in Deira, Dubai.`
**Recommended: #1** (leads with action + price, names Deira store, no fee/free-delivery claims).

### 3) Recommended H1
`Custom company stamps in Dubai — designed online, made for your business`

### 4) Exact hero copy
- **Eyebrow:** `Made in Deira, Dubai`
- **H1:** `Custom company stamps in Dubai — designed online, made for your business`
- **Sub:** `Design your self-inking company stamp online, preview the exact impression, then order it — from AED 99. Round, oval, rectangle or square, with your logo and bilingual Arabic/English text.`
- **Primary CTA:** `Design your stamp` → configurator
- **Secondary CTA:** `Compare shapes & sizes` → company-stamps.html
- **Trust row (verifiable only):** `Self-inking & refillable` · `Design online, free preview` · `Studio in Deira, Dubai` *(no invented counts/ratings)*

### 5) Section-by-section outline
1. **Hero** (above) — configurator teaser or live tool
2. **"Design your company stamp online"** (H2) — the tool / how the preview works; anchors *company stamp maker* softly, links to maker page/tool
3. **"Company stamp shapes"** (H2) — 4 shape cards → deep-link to company-stamps.html#shape; anchors round/oval/rectangle/square company stamp
4. **"How to order a company stamp in Dubai"** (H2, H3 steps) — Design → Verify (trade licence + Emirates ID) → Collect in Deira or delivery. *No fees.*
5. **"Company stamps for every UAE business"** (H2) — near-me/local block: naturally mentions Dubai + "collect from our Deira studio" + serving the UAE. Anchors *stamp maker in Dubai, company stamp UAE*
6. **"Why businesses choose MyStamp"** (H2) — specialisation, live preview, self-inking quality (no invented stats)
7. **"Pricing"** (H2) — from AED 99, flat per shape, logo add-on. *No delivery fees, no free-delivery.*
8. **FAQ** (H2) — high-intent (below)
9. **Final CTA** — design/order

### 6) Local & near-me placement (natural)
- Eyebrow + section 5 + FAQ: "company stamp maker in Dubai", "collect from our Deira studio", "company stamps across the UAE", "looking for a stamp maker near you in Dubai" — each **once**, in context, never stacked.

### 7) Trust signals required (verifiable only)
- Physical Deira studio address (customer-facing) — powerful local signal
- Legal entity: GLS PRO (F.Z.E) named in footer/about (distinct from store)
- Secure card checkout logos
- Real Google reviews **only if they exist** (link to GBP). If none yet → omit rating; use "designed and made in Dubai" instead.

### 8) Internal links from homepage
- `Compare stamp shapes & sizes` → company-stamps.html
- `Use the online stamp maker` → company-stamp-maker.html (Option A) or #configurator (Option B)
- `Visit our Deira studio` → contact-us.html
- `About GLS PRO / MyStamp` → about-us.html

### 9) FAQ (high-intent)
- How much does a company stamp cost in Dubai? → *from AED 99, flat per shape; logo add-on AED 19 (no fees mentioned)*
- Where is your stamp shop? → *Deira, Dubai (studio); GLS PRO F.Z.E is the registered company*
- How quickly can I get a company stamp? → *designed online instantly; made in hours (only if true)*
- What do I need to order? → *trade licence + Emirates ID for verification*
- Which company stamp shape should I choose? → *round/oval standard; rectangle for more lines; square modern*

### 10) Schema (verifiable facts only)
- `Organization` (GLS PRO F.Z.E, legal, registered address) + `LocalBusiness` (MyStamp Deira store, store address, phone, hours, geo) linked via parentOrganization
- `WebSite` + `SearchAction` (if internal search exists)
- `FAQPage` (mirrors visible FAQ)
- `Product` + `Offer` (price 99, priceCurrency AED, availability) — **omit AggregateRating unless real review data**
- Do **not** claim bank/government acceptance in schema.

---

# PHASE 5 — LOCAL SEO ACTION PLAN

**Google Business Profile (highest leverage for near-me):**
- Create/claim GBP for the **MyStamp Deira store**. Primary category: *Rubber stamp store* (or *Stamp shop*). Secondary: *Print shop*, *Sign shop*.
- Business name exactly as signage (avoid keyword stuffing the name).
- Service area: Dubai + UAE. Add products (company stamp round/oval/rectangle/square, from AED 99), services, photos of real stamps + storefront.
- Enable messaging + booking link → homepage.

**NAP consistency:**
- Define ONE canonical NAP for the store (Name = MyStamp, Address = exact Deira address, Phone = +971 54 403 2018). Use identical NAP on: site footer, contact-us, about-us, GBP, every citation.
- Keep **GLS PRO F.Z.E legal/registered address separate**, shown on legal pages + Organization schema — never mix the two.

**Exact store location:**
- Publish the precise Deira address + Google Maps embed on contact-us.html; link GBP "website" to homepage and "appointments" to configurator.

**Review acquisition (no fabrication):**
- Post-purchase WhatsApp/email asking for a Google review with a direct GBP review link. Only real reviews. As they accumulate, we can *then* add truthful AggregateRating.

**Citations (UAE/Dubai):**
- Consistent listings on: Google, Bing Places, Apple Business Connect, Yalla Dubai, Connect.ae, Yellow Pages UAE, dubai-online directories, Yalwa, local chambers. Identical NAP.

**Local backlinks:**
- Dubai SME blogs, business-setup consultancies (they advise new companies who need stamps), free-zone community pages, "how to start a business in Dubai" resource pages. Guest content: "What company stamp does your Dubai business need?"

**Categories (site + GBP):** rubber stamp store, stamp shop, company seal maker.

**Maps ↔ landing page:** GBP website = homepage; ensure LocalBusiness schema `hasMap` + matching NAP so Google connects entity → page.

**Near-me ranking signals:** GBP proximity + reviews + citations + on-page Deira address + LocalBusiness schema + mobile speed. On-page copy alone won't rank near-me without GBP.

---

# PHASE 6 — 90-DAY PRIORITY ROADMAP

### Critical fixes — Days 1–7
| Task | Page | Target kw | SEO impact | Difficulty | Dependency | Success metric |
|---|---|---|---|---|---|---|
| Remove fabricated AggregateRating (41 / 312) from all schema | index, company-stamps, maker | — | High (avoids penalty) | Low | — | 0 rating markup without real data; Rich Results test clean |
| Remove "10k+/10,000+/312/thousands" unverifiable claims | 3 marketing pages | — | High (trust/compliance) | Low | — | No unverifiable stats in copy |
| Remove delivery-fee + free-delivery lines | company-stamps | — | Med (compliance) | Low | — | No fee/free-delivery text on marketing pages |
| Soften "accepted by banks/government" | company-stamps | — | Med | Low | — | Claim defensible or removed |
| Add self-canonicals everywhere missing | 9 pages | — | Med | Low | — | Every indexable page has self-canonical |
| `noindex,follow` on signature.html | signature | — | Med | Low | — | Excluded from index |
| Create robots.txt + sitemap.xml (indexable canonicals only) | site | — | Med | Low | Live domain | Sitemap submitted in GSC |
| Resolve index vs company-stamps cannibalisation (retarget) | both | company stamp | **Highest** | Med | Copy approval | One URL per primary kw |
| Decide maker Option A vs B | maker | tool cluster | High | Med→High | **Your decision** | No doorway; tool has a home |

### Homepage & commercial pages — Days 8–21
| Task | Page | Target kw | Impact | Difficulty | Dependency | Metric |
|---|---|---|---|---|---|---|
| Rewrite title/meta/H1 + hero | index | company stamp (+local) | High | Low | Approval | CTR + impressions for head/local terms (GSC) |
| Build section outline (Phase 4) | index | local cluster | High | Med | — | Homepage ~1,600–1,900 words, local sections present |
| Re-scope to shapes/sizes/samples | company-stamps | shape/size cluster | High | Med | Cannibalisation fix | Ranks for shape/size/sample terms |
| Consistent LocalBusiness + Organization schema (NAP) | index, contact, about | near-me | High | Med | GBP address | Valid schema; entity consistency |
| Internal-link pass (exact anchors) | all commercial | cluster | Med | Low | — | Clean hub-and-spoke links |

### Supporting content — Days 22–45
| Task | Page (new) | Target kw | Impact | Difficulty | Dependency | Metric |
|---|---|---|---|---|---|---|
| Requirements guide | guide/requirements-uae | company stamp requirements | Med | Med | — | Ranks long-tail; links to homepage |
| Size guide | guide/size-guide | stamp size (110/16) | Med | Low | — | Ranks "stamp size" |
| Samples page | guide/samples | company stamp sample (40/12) | Low-Med | Low | — | Ranks "sample" |
| Shape comparison | guide/round-vs-oval | shape terms | Med | Low | — | Supports company-stamps |
| Signature landing (separate from workflow) | signature-stamp.html | signature stamp (140/26) | Med | Med | — | Ranks signature stamp |

### Local authority & backlinks — Days 46–90
| Task | Impact | Difficulty | Dependency | Metric |
|---|---|---|---|---|
| Launch + optimise GBP (Deira) | **Highest for near-me** | Med | Store address | Local pack presence for "near me"/Dubai |
| Build 15–25 consistent UAE citations | High | Med | Canonical NAP | Citation consistency score |
| Review acquisition flow (real reviews) | High | Med | GBP live | Growing real review count |
| 5–10 local/niche backlinks | High (head term) | High | Outreach | Referring domains up; head-term movement |
| Re-measure & iterate vs SERP | — | — | GSC/SEMrush | Position gains on target clusters |

---

## SUMMARY OF WHAT NEEDS YOUR APPROVAL BEFORE I TOUCH ANYTHING
1. **Ratings:** Do you have *real* Google reviews (and a count)? If yes, give the number + GBP link. If no → I remove all AggregateRating markup and rating claims.
2. **Maker page:** Option A (move the real tool onto it) or Option B (301 → homepage tool)? A is a structural exception to "copy-only."
3. **Cannibalisation:** Approve homepage = "company stamp" head/local authority, and company-stamps.html re-scoped to shapes/sizes/samples.
4. **Delivery:** Confirm I strip all fee + free-delivery language from marketing pages (kept in checkout only).
5. **Acceptance claim:** Provide an official source for bank/government acceptance, or I soften the wording.
6. **"Made in hours / 4-hour":** Confirm this is truthful before I keep it as a trust signal.

Once you approve these six points (and pick A/B), I'll implement **only** the allowed elements — titles, metas, H1/H2/H3, paragraphs, FAQs, internal links, canonicals, robots, sitemap, and valid schema — preserving every existing class and the visual structure.
