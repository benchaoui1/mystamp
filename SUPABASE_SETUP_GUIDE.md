# 🗄️ ربط Supabase — حفظ الطلبات والملفات

هاد الدليل غادي يخليك تحفظ كل طلب + ملفات العميل (Emirates ID / License) فـ Supabase.
خود وقتك، كل خطوة بسيطة.

---

## ✅ الخطوة 1 — صاوب الجدول (Table)

1. دخل لـ **supabase.com** → المشروع ديالك
2. من القائمة اللسرى → **SQL Editor** → **New query**
3. الصق هاد الكود كامل ودوس **Run**:

```sql
-- جدول الطلبات
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  order_ref text unique not null,
  status text default 'pending',
  pay_method text,

  -- التصميم
  shape text,
  size text,
  ink_color text,
  company text,
  with_logo boolean default false,
  license_number text,

  -- الكمية والسعر
  quantity int default 1,
  free_stamps int default 0,
  total_aed numeric,

  -- التوصيل
  delivery_method text,
  delivery_fee numeric,

  -- العميل
  customer_name text,
  customer_phone text,
  customer_email text,
  customer_address text,
  emirate text,

  -- الملفات (روابط داخل Storage)
  documents jsonb
);

-- تفعيل الأمان
alter table public.orders enable row level security;

-- السماح للموقع (anon) بإضافة طلب جديد فقط
create policy "Anyone can create an order"
  on public.orders for insert
  to anon
  with check (true);

-- السماح بتحديث الحالة حسب رقم الطلب
create policy "Anyone can update order status"
  on public.orders for update
  to anon
  using (true)
  with check (true);
```

> ⚠️ ملاحظة: هاد السياسات (policies) كتسمح فقط بـ **إضافة** و**تحديث** الطلبات.
> ماكتسمحش لأي واحد يقرا الطلبات ديال الناس الآخرين — أمان مزيان. ✓

---

## ✅ الخطوة 2 — صاوب مكان تخزين الملفات (Storage)

1. من القائمة اللسرى → **Storage** → **New bucket**
2. الاسم بالضبط: **`order-documents`**
3. خليه **Private** (ماشي public) — للأمان، حيت فيه Emirates ID
4. دوس **Create bucket**

ومن بعد، باش الموقع يقدر يرفع الملفات:

5. مشي لـ **SQL Editor** → New query → الصق ودوس Run:

```sql
-- السماح للموقع برفع الملفات لـ bucket order-documents
create policy "Anyone can upload order documents"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'order-documents');
```

> الملفات كتكون **خاصة** (ماكيقدرش يشوفها العموم). نتا فقط من لوحة Supabase تقدر تشوفها وتحمّلها. ✓

---

## ✅ الخطوة 3 — جيب المفاتيح وحطهم فالكود

1. من القائمة اللسرى → **Project Settings** (الترس تحت) → **API**
2. غادي تلقى:
   - **Project URL** (مثال: `https://abcdxyz.supabase.co`)
   - **anon public** key (مفتاح طويل)

3. حل الملف **`supabase-config.js`** وبدّل القيمتين:

```js
const SUPABASE_URL = 'https://abcdxyz.supabase.co';        // ← Project URL ديالك
const SUPABASE_ANON_KEY = 'eyJhbGci...';                   // ← anon public key
```

> ✓ الـ **anon key آمن** يبان فالموقع — هادشي عادي ومقصود. الأمان كيجي من الـ policies اللي درنا فوق، ماشي من إخفاء المفتاح. (السر الوحيد اللي ماخصّوش يبان هو الـ **service_role** key — هادا ماكنستعملوهش هنا).

---

## ✅ الخطوة 4 — رفع الملفات لـ GitHub

زيد هاد الملفات الجداد لمشروعك:
- `supabase-config.js`
- `supabase-orders.js`
- النسخة الجديدة من: `checkout.html` + `checkout.js`

اعمل push → Vercel غادي يحدّث.

---

## ✅ الخطوة 5 — جرّب

1. دخل لموقعك → صمّم ختم → checkout
2. عبّي المعلومات + ارفع شي صورة فـ Emirates ID
3. دوس Confirm (كارط ولا واتساب)
4. مشي لـ Supabase → **Table Editor** → `orders` → خاص تلقى الطلب الجديد ✓
5. مشي لـ **Storage** → `order-documents` → خاص تلقى الصورة فمجلد رقم الطلب ✓

---

## 🔄 كيفاش كيخدم كلشي مع بعضياتو

```
العميل كيعبّي الطلب + يرفع ID/License
        ↓
الملفات كترفع لـ Supabase Storage
        ↓
الطلب كيتسجل فجدول orders (status = pending)
        ↓
كيبدا الدفع Telr
        ↓
بعد الدفع الناجح → الطلب كيتحدّث (status = paid)*
```

\* *تحديث الحالة لـ paid كيتطلب خطوة إضافية صغيرة (webhook). إلا بغيتيها، قول ليا ونزيدها. دابا كل طلب كيتسجل بـ `pending`، وأنت كتشوف فلوسك فـ Telr وتأكد يدوياً.*

---

## 📊 كيفاش تشوف الطلبات

- **الطلبات:** Supabase → Table Editor → `orders`
- **الملفات:** Supabase → Storage → `order-documents` → كل مجلد باسم رقم الطلب (MS-xxxxxx)

---

## 📞 إلا تقطّع شي حاجة

قول ليا فأي خطوة وقفتي. الأخطاء الشائعة:
- نسيتي تبدّل القيم فـ `supabase-config.js`
- اسم الـ bucket ماشي `order-documents` بالضبط
- نسيتي تعمل Run على الـ SQL policies
