# VERITAS · Laundry Aston Cirebon

Sistem pelacakan laundry tamu Hotel Aston Cirebon — dari kamar, ke laundry atau vendor, sampai kembali ke kamar. Lengkap dengan bukti foto, hitung ganda, tanda tangan, dan verifikasi HK Leader.

**Teknologi:** Next.js 16 + Tailwind CSS · Firebase Authentication (Login Google) · Firestore · Google Drive (foto) · deploy di Vercel.

> **Catatan keamanan:** aplikasi ini memakai Next.js versi terbaru (16.x) dan sudah bebas dari peringatan keamanan (`npm audit` = 0 kerentanan). Vercel akan **menolak deploy** kalau versi Next.js-nya lama dan punya celah keamanan. Kalau suatu saat muncul pesan *"Vulnerable version of Next.js detected"*, lihat [bagian 12](#12-kalau-vercel-menolak-karena-versi-nextjs) di bawah.

---

## Daftar Isi

1. [Yang perlu disiapkan](#1-yang-perlu-disiapkan)
2. [Membuat project Firebase](#2-membuat-project-firebase)
3. [Mengisi file rahasia (.env.local)](#3-mengisi-file-rahasia-envlocal)
4. [Menjalankan di komputer sendiri](#4-menjalankan-di-komputer-sendiri)
5. [Memasang Security Rules](#5-memasang-security-rules-wajib)
6. [Mengaktifkan upload foto ke Google Drive](#6-mengaktifkan-upload-foto-ke-google-drive)
7. [Upload ke GitHub](#7-upload-ke-github)
8. [Deploy ke Vercel](#8-deploy-ke-vercel)
9. [Pemakaian pertama kali](#9-pemakaian-pertama-kali)
10. [Cara update aplikasi nanti](#10-cara-update-aplikasi-nanti)
11. [Kalau ada masalah](#11-kalau-ada-masalah)
12. [Kalau Vercel menolak karena versi Next.js](#12-kalau-vercel-menolak-karena-versi-nextjs)

---

## 1. Yang perlu disiapkan

Sebelum mulai, pastikan sudah ada di komputer:

- **Node.js versi 20 atau lebih baru** — unduh di <https://nodejs.org> (pilih versi LTS).
- **Git** — unduh di <https://git-scm.com/downloads>.
- **Akun Google** `syam.rakhmany@gmail.com` (ini Super Admin aplikasi).
- **Akun GitHub** (`Djebod`) dan **akun Vercel**.

Cara memeriksa Node.js sudah terpasang — buka Terminal / Command Prompt, ketik satu per satu:

```bash
node -v
```

```bash
npm -v
```

Kalau muncul angka versi, berarti sudah siap.

---

## 2. Membuat project Firebase

### Langkah 2.1 — Buat project

1. Buka <https://console.firebase.google.com>, login dengan `syam.rakhmany@gmail.com`.
2. Klik **Add project**.
3. Beri nama: `laundry-aston-cirebon` → **Continue**.
4. Google Analytics boleh **dimatikan** (geser tombolnya ke kiri) → **Create project**.
5. Tunggu sampai selesai, lalu klik **Continue**.

### Langkah 2.2 — Aktifkan Login Google

1. Menu kiri: **Build → Authentication** → klik **Get started**.
2. Buka tab **Sign-in method**.
3. Klik **Google** → geser **Enable** menjadi aktif.
4. Bagian *Project support email*, pilih `syam.rakhmany@gmail.com`.
5. Klik **Save**.

### Langkah 2.3 — Buat database Firestore

1. Menu kiri: **Build → Firestore Database** → klik **Create database**.
2. Pilih lokasi: **asia-southeast2 (Jakarta)** → **Next**.
3. Pilih **Start in production mode** → **Create**.
4. Tunggu sampai databasenya jadi.

### Langkah 2.4 — Ambil konfigurasi untuk aplikasi

1. Klik ikon gerigi ⚙️ di kiri atas → **Project settings**.
2. Gulir ke bawah sampai bagian **Your apps**.
3. Klik ikon **`</>`** (Web).
4. App nickname: ketik `web` → **Register app**.
5. Akan muncul kotak berisi tulisan seperti ini:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "laundry-aston-cirebon.firebaseapp.com",
  projectId: "laundry-aston-cirebon",
  storageBucket: "laundry-aston-cirebon.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};
```

**Salin dan simpan semua nilai itu** — akan dipakai di langkah berikutnya. Jangan ditutup dulu halamannya.

---

## 3. Mengisi file rahasia (.env.local)

Di dalam folder aplikasi sudah ada file contoh bernama `.env.local.example`.

1. **Salin** file itu, lalu **ganti namanya** menjadi `.env.local` (tanpa kata *example*).
2. Buka `.env.local` dengan Notepad / VS Code.
3. Isi setiap baris dengan nilai dari Langkah 2.4:

```
NEXT_PUBLIC_FB_API_KEY=AIza...
NEXT_PUBLIC_FB_AUTH_DOMAIN=laundry-aston-cirebon.firebaseapp.com
NEXT_PUBLIC_FB_PROJECT_ID=laundry-aston-cirebon
NEXT_PUBLIC_FB_STORAGE_BUCKET=laundry-aston-cirebon.firebasestorage.app
NEXT_PUBLIC_FB_SENDER_ID=1234567890
NEXT_PUBLIC_FB_APP_ID=1:1234567890:web:abcdef

NEXT_PUBLIC_ADMIN_EMAILS=syam.rakhmany@gmail.com
NEXT_PUBLIC_UPLOAD_URL=
NEXT_PUBLIC_HOTEL_NAME=Hotel Aston Cirebon
NEXT_PUBLIC_HOTEL_CODE=ACR
```

> `NEXT_PUBLIC_UPLOAD_URL` boleh dikosongkan dulu. Diisi nanti di Langkah 6.

> **Penting:** file `.env.local` sudah terdaftar di `.gitignore`, jadi tidak akan pernah ikut ter-upload ke GitHub. Jangan pernah mengirim isi file ini lewat chat atau email.

---

## 4. Menjalankan di komputer sendiri

Buka Terminal, masuk ke folder aplikasi, lalu jalankan perintah ini **satu per satu**:

```bash
npm install
```

Tunggu sampai selesai (butuh beberapa menit pada percobaan pertama). Lalu:

```bash
npm run dev
```

Buka browser ke **<http://localhost:3000>**. Aplikasi akan tampil.

Untuk menghentikannya, tekan `Ctrl + C` di Terminal.

---

## 5. Memasang Security Rules (WAJIB)

Ini adalah **keamanan yang sesungguhnya**. Tanpa langkah ini, siapa pun yang tahu alamat database bisa membaca data tamu.

1. Buka **Firebase Console → Firestore Database → tab Rules**.
2. **Hapus seluruh isi** kotak yang ada.
3. Buka file **`firestore.rules`** di folder aplikasi, **salin seluruh isinya**, lalu tempel ke kotak tadi.
4. Klik **Publish**.

Apa yang dijaga aturan ini:

- Hanya akun yang sudah login **dan** sudah diberi peran yang bisa membaca data.
- Nota yang sudah diverifikasi (**terkunci**) tidak bisa diubah siapa pun kecuali Super Admin.
- Yang boleh mengunci nota hanya **HK Leader** dan **Super Admin**.
- Yang boleh mengubah harga, vendor, dan peran pengguna hanya **Super Admin**.
- Semua koleksi lain yang tidak disebut: **ditolak**.

---

## 6. Mengaktifkan upload foto ke Google Drive

Foto tidak disimpan di Firebase (itu butuh kartu kredit), melainkan di Google Drive — dan gratis.

### Langkah 6.1 — Siapkan folder Drive

1. Buka <https://drive.google.com>.
2. Klik **New → New folder**, beri nama `Foto-Laundry-Aston` → **Create**.
3. Buka folder tersebut (klik dua kali).
4. Lihat alamat di address bar browser, bentuknya seperti:
   `https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrS`
5. **Salin bagian setelah `/folders/`** — itulah ID folder.

### Langkah 6.2 — Pasang Apps Script

1. Buka <https://script.google.com> → klik **New project**.
2. Hapus semua kode bawaan di layar.
3. Buka file **`apps-script/Code.gs`** di folder aplikasi, salin seluruh isinya, tempel ke Apps Script.
4. Ganti tulisan `PASTE_ID_FOLDER_DISINI` dengan ID folder dari Langkah 6.1.
5. Klik ikon simpan (💾).

### Langkah 6.3 — Publikasikan

1. Klik tombol **Deploy** (kanan atas) → **New deployment**.
2. Klik ikon gerigi ⚙️ di sebelah *Select type* → pilih **Web app**.
3. Isi:
   - **Description**: `Upload foto laundry`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
4. Klik **Deploy**.
5. Klik **Authorize access** → pilih akun Google → kalau muncul peringatan, klik **Advanced** → **Go to (nama project)** → **Allow**.
6. Salin **Web app URL** yang muncul.

### Langkah 6.4 — Pasang URL-nya ke aplikasi

Buka `.env.local`, isi barisnya:

```
NEXT_PUBLIC_UPLOAD_URL=https://script.google.com/macros/s/AKfyc.../exec
```

Jalankan ulang `npm run dev` supaya perubahannya terbaca.

> **Kalau nanti kode Apps Script diubah:** Deploy → Manage deployments → ikon pensil → Version: **New version** → Deploy. Tanpa ini, perubahan tidak aktif.

---

## 7. Upload ke GitHub

Pastikan file `.gitignore` sudah ada (sudah tersedia di folder ini) **sebelum** perintah pertama.

### Langkah 7.1 — Buat repo

1. Buka <https://github.com/new>.
2. Repository name: `laundry-aston-cirebon`
3. Pilih **Private**.
4. **Jangan** centang "Add a README file".
5. Klik **Create repository**.

### Langkah 7.2 — Upload dari komputer

Di Terminal, dari dalam folder aplikasi, jalankan **satu per satu**:

```bash
git init
```

```bash
git add .
```

```bash
git commit -m "Pertama kali upload aplikasi laundry"
```

```bash
git branch -M main
```

```bash
git remote add origin https://github.com/Djebod/laundry-aston-cirebon.git
```

```bash
git push -u origin main
```

Kalau diminta login, ikuti petunjuk di layar.

### Langkah 7.3 — Periksa

Buka repo di GitHub. Pastikan **`.env.local` TIDAK ADA** di daftar file. Kalau ternyata ada, jalankan:

```bash
git rm --cached .env.local
```

```bash
git commit -m "Hapus file rahasia dari Git"
```

```bash
git push
```

Lalu ganti semua kredensial di Firebase, karena sudah terlanjur terlihat.

---

## 8. Deploy ke Vercel

1. Buka <https://vercel.com> → **Login with GitHub**.
2. Klik **Add New… → Project**.
3. Cari `laundry-aston-cirebon` → klik **Import**.
4. Buka bagian **Environment Variables**, lalu tambahkan satu per satu (nama di kiri, nilai di kanan) — sama persis dengan isi `.env.local`:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_FB_API_KEY` | (dari Firebase) |
   | `NEXT_PUBLIC_FB_AUTH_DOMAIN` | (dari Firebase) |
   | `NEXT_PUBLIC_FB_PROJECT_ID` | (dari Firebase) |
   | `NEXT_PUBLIC_FB_STORAGE_BUCKET` | (dari Firebase) |
   | `NEXT_PUBLIC_FB_SENDER_ID` | (dari Firebase) |
   | `NEXT_PUBLIC_FB_APP_ID` | (dari Firebase) |
   | `NEXT_PUBLIC_ADMIN_EMAILS` | `syam.rakhmany@gmail.com` |
   | `NEXT_PUBLIC_UPLOAD_URL` | (link Apps Script) |
   | `NEXT_PUBLIC_HOTEL_NAME` | `Hotel Aston Cirebon` |
   | `NEXT_PUBLIC_HOTEL_CODE` | `ACR` |

5. Klik **Deploy**, tunggu sekitar 1–2 menit.
6. Catat alamat yang muncul, mis. `https://laundry-aston-cirebon.vercel.app`.

### Langkah 8.1 — Izinkan domain di Firebase (JANGAN DILEWATI)

Tanpa langkah ini, login Google akan **gagal** di aplikasi yang sudah online.

1. Buka **Firebase Console → Authentication → tab Settings → Authorized domains**.
2. Klik **Add domain**.
3. Ketik `laundry-aston-cirebon.vercel.app` → **Add**.

Kalau nanti pakai domain sendiri, tambahkan juga domain itu di sini.

---

## 9. Pemakaian pertama kali

1. Buka aplikasinya, klik **Login dengan Google**, masuk dengan `syam.rakhmany@gmail.com`. Akun ini otomatis menjadi **Super Admin**.
2. Buka menu **Master Data → Daftar Harga** → klik **Isi dengan katalog contoh (18 item)** → lalu sesuaikan setiap tarif dengan tarif resmi Aston Cirebon.
3. Buka tab **Vendor Rekanan** → tambahkan vendor laundry rekanan beserta SLA (janji waktu retur) mereka.
4. Buka **Pengaturan Sistem** → sesuaikan jam cut-off, jam selesai, durasi express, dan surcharge express.
5. Minta setiap staf **login sekali** dengan akun Google mereka.
6. Buka menu **Pengguna** → berikan peran masing-masing:

   | Peran | Untuk siapa | Bisa apa |
   |---|---|---|
   | **Laundry Valet** | Petugas jemput & antar | Buat nota pickup, tandai siap antar & diantar |
   | **Laundry Attendant** | Petugas cuci & setrika | Sortir, proses, tandai siap antar |
   | **HK Supervisor** | Supervisor housekeeping | Kirim ke vendor, terima & QC retur |
   | **HK Leader** | Leader housekeeping | Semua di atas + verifikasi & kunci nota |
   | **Front Office** | Resepsionis | Buat nota pickup saja |
   | **Super Admin** | Anda | Semuanya, termasuk harga & pengguna |

---

## 10. Cara update aplikasi nanti

Setiap kali ada perubahan pada kode, jalankan **tiga perintah ini** dari dalam folder aplikasi:

```bash
git add .
```

```bash
git commit -m "Jelaskan perubahannya di sini"
```

```bash
git push
```

Vercel akan otomatis membuat versi baru. Tunggu ±1 menit, lalu muat ulang aplikasinya.

**Kalau muncul error "dubious ownership"** (biasanya karena berganti komputer):

```bash
git config --global --add safe.directory "*"
```

**Kalau muncul konflik saat push:**

```bash
git pull --rebase
```

```bash
git push
```

---

## 11. Kalau ada masalah

| Yang terlihat | Sebabnya | Cara memperbaiki |
|---|---|---|
| Halaman "Aplikasi belum tersambung ke Firebase" | Environment Variable belum diisi | Ulangi Langkah 3 (lokal) atau Langkah 8 nomor 4 (Vercel), lalu deploy ulang |
| Login gagal, muncul *unauthorized-domain* | Domain Vercel belum didaftarkan | Ulangi Langkah 8.1 |
| "Akses ditolak" saat membuka data | Security Rules belum dipasang, atau peran belum diberikan | Ulangi Langkah 5, lalu berikan peran di menu Pengguna |
| Tombol kamera tidak bisa ditekan | `NEXT_PUBLIC_UPLOAD_URL` masih kosong | Ulangi Langkah 6 |
| Foto gagal diunggah | Apps Script belum di-deploy ulang setelah diubah | Deploy → Manage deployments → pensil → New version → Deploy |
| Data tidak muncul padahal sudah disimpan | Sinyal internet putus | Data tersimpan di HP dan terkirim otomatis saat sinyal kembali — lihat lencana "Luring" di bagian atas |
| Nota tidak bisa diverifikasi | Masih ada kendala terbuka | Selesaikan dulu di menu **Kendala & Klaim** |

---

## 12. Kalau Vercel menolak karena versi Next.js

Kalau di halaman Deployment muncul kotak merah:

> **Build Failed** — Vulnerable version of Next.js detected, please update immediately.

Artinya versi Next.js yang dipakai punya celah keamanan yang sudah ditambal di versi lebih baru. **Jangan klik tombol "Upgrade"** di layar Vercel — itu menawarkan paket berbayar, bukan memperbaiki masalahnya. Perbaikannya dilakukan dari komputer Anda sendiri, gratis.

Buka Terminal di dalam folder aplikasi, jalankan **satu per satu**:

```bash
npm install next@latest react@latest react-dom@latest
```

```bash
npm install -D postcss@latest autoprefixer@latest @types/react@latest @types/react-dom@latest
```

Periksa sudah bersih atau belum:

```bash
npm audit
```

Kalau muncul tulisan `found 0 vulnerabilities`, berarti sudah aman. Lalu pastikan aplikasinya masih bisa dibangun:

```bash
npm run build
```

Kalau muncul tanda ✓ dan daftar halaman, berarti berhasil. Terakhir, kirim perubahannya:

```bash
git add .
```

```bash
git commit -m "Update Next.js ke versi terbaru untuk perbaikan keamanan"
```

```bash
git push
```

Vercel akan otomatis mencoba deploy ulang. Tunggu ±1–2 menit.

> **Penting:** file `package-lock.json` **harus ikut** ter-commit. File itu yang memberi tahu Vercel versi persis setiap paket. Perintah `git add .` sudah menyertakannya secara otomatis.

Kalau `npm run build` gagal setelah update (kadang versi baru mengubah aturan), kembalikan dulu ke versi sebelumnya sambil mencari tahu:

```bash
npm install next@15.5.24
```

Versi `15.5.24` adalah versi lama yang tetap mendapat tambalan keamanan, jadi Vercel juga menerimanya.

---

## Struktur folder

```
laundry-aston-cirebon/
├── app/
│   ├── layout.tsx            → kerangka halaman + favicon + metadata
│   ├── page.tsx              → Dashboard
│   ├── icon.png              → FAVICON (ikon di tab browser)
│   ├── pickup/               → Form pickup baru (tahap 02)
│   ├── orders/               → Daftar nota + halaman detail
│   ├── process/              → Papan kerja proses in-house
│   ├── vendor/               → Meja serah terima vendor
│   ├── vendor-return/        → Terima & QC dari vendor
│   ├── ready/                → Siap antar (dikelompokkan per lantai)
│   ├── delivered/            → Sudah diantar
│   ├── verification/         → Meja audit HK Leader
│   ├── issues/               → Register kendala & klaim
│   ├── evidence/             → Galeri bukti foto & tanda tangan
│   ├── reports/              → Laporan & ekspor CSV
│   ├── master/               → Daftar harga & vendor
│   ├── users/                → Pengguna & peran
│   └── settings/             → Pengaturan sistem
├── components/               → Komponen tampilan bersama
├── lib/
│   ├── firebase.ts           → Sambungan Firebase (baca dari ENV)
│   ├── auth-context.tsx      → Siapa yang login & perannya
│   ├── data.ts               → Semua operasi database
│   ├── status.ts             → Mesin status & aturan peran
│   ├── types.ts              → Bentuk data
│   ├── catalog.ts            → Katalog item contoh
│   ├── upload.ts             → Upload foto ke Drive
│   ├── format.ts             → Format rupiah, tanggal, kode lacak
│   └── hooks.ts              → Pengambilan data real-time
├── apps-script/Code.gs       → Kode upload foto (dipasang di Google)
├── firestore.rules           → Aturan keamanan database
├── .env.local.example        → Contoh isi file rahasia
└── .gitignore                → Daftar file yang tidak ikut ke GitHub
```

---

## Alur status nota

```
01 Permintaan  →  02 Sudah Diambil  →  03 Disortir
                                          ├── 04a Proses In-House ──┐
                                          └── 04b Di Vendor ────────┤
                                                                    ↓
        09 Terverifikasi ← 08 Menunggu Audit ← 07 Diantar ← 06 Siap Antar ← 05 Kembali & QC

        Cabang kendala (hilang / rusak / luntur / salah kamar / terlambat / komplain)
        bisa dibuka dari tahap mana pun, dan menghalangi penguncian nota.
```

**Tiga titik hitung wajib:** saat pengambilan (02), saat retur (05), dan saat pengantaran (07).
**Satu titik kunci:** verifikasi HK Leader (09) — setelah ini nota tidak bisa diubah.

---

Dibangun untuk Housekeeping Hotel Aston Cirebon.
