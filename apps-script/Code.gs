/**
 * =====================================================================
 * UPLOAD FOTO KE GOOGLE DRIVE — Aston Cirebon Guest Laundry
 * =====================================================================
 * Kode ini dipasang di https://script.google.com (Google Apps Script).
 * Tugasnya sederhana: menerima foto dari aplikasi, menyimpannya ke
 * folder Google Drive, lalu mengembalikan LINK fotonya.
 *
 * Data laundry tetap tersimpan di Firestore; yang masuk ke Drive hanya
 * file fotonya, dan yang disimpan ke Firestore hanya linknya.
 *
 * CARA PASANG (sekali saja):
 * 1. Buat folder di Google Drive, mis. "Foto-Laundry-Aston".
 * 2. Buka foldernya, salin ID folder dari URL — bagian setelah /folders/
 * 3. Buka https://script.google.com → New project → hapus isi bawaan →
 *    tempel seluruh kode ini.
 * 4. Ganti PASTE_ID_FOLDER_DISINI di bawah dengan ID folder tadi.
 * 5. Deploy → New deployment → ikon gerigi → Web app
 *      - Execute as     : Me
 *      - Who has access : Anyone
 *    → Deploy → Authorize access → izinkan.
 * 6. Salin "Web app URL", isikan ke Environment Variable
 *    NEXT_PUBLIC_UPLOAD_URL di Vercel (dan di .env.local saat mencoba
 *    di komputer sendiri).
 *
 * KALAU KODE INI DIUBAH KEMUDIAN:
 *    Deploy → Manage deployments → ikon pensil → Version: New version
 *    → Deploy. Tanpa langkah ini, perubahan tidak aktif.
 * =====================================================================
 */

var FOLDER_ID = "PASTE_ID_FOLDER_DISINI";

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (!body.foto) return balas({ status: "error", message: "Tidak ada data foto" });

    var folder = DriveApp.getFolderById(FOLDER_ID);

    // Buat subfolder per bulan supaya Drive tidak berantakan.
    var namaBulan = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM");
    var sub = folder.getFoldersByName(namaBulan);
    var tujuan = sub.hasNext() ? sub.next() : folder.createFolder(namaBulan);

    var potongan = String(body.foto).split(",");
    var isi = potongan.length > 1 ? potongan[1] : potongan[0];
    var tipe = String(body.foto).indexOf("image/png") > -1 ? "image/png" : "image/jpeg";
    var ekstensi = tipe === "image/png" ? ".png" : ".jpg";

    var namaFile =
      (body.nama || "foto") +
      "-" +
      Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMdd-HHmmss") +
      ekstensi;

    var blob = Utilities.newBlob(Utilities.base64Decode(isi), tipe, namaFile);
    var file = tujuan.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return balas({
      status: "ok",
      url: "https://drive.google.com/file/d/" + file.getId() + "/view",
      id: file.getId(),
      nama: namaFile
    });
  } catch (err) {
    return balas({ status: "error", message: String(err) });
  }
}

function doGet() {
  return balas({ status: "ok", message: "Layanan upload Aston Cirebon siap." });
}

function balas(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
