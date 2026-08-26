import type { PriceItem } from "./types";

/**
 * Daftar item & tarif AWAL (contoh struktur).
 * Dipakai kalau koleksi price_list di Firestore masih kosong,
 * supaya aplikasi langsung bisa dicoba. Ganti dengan tarif resmi
 * Aston Cirebon lewat menu Master Data.
 */
export const KATALOG_AWAL: PriceItem[] = [
  { id: "SHIRT", itemName: "Kemeja / Blouse", category: "Atasan", prices: { wash_press: 25000, press_only: 15000, dry_clean: 35000 }, defaultRoute: "in_house", active: true },
  { id: "TSHIRT", itemName: "Kaos / T-Shirt", category: "Atasan", prices: { wash_press: 20000, press_only: 12000 }, defaultRoute: "in_house", active: true },
  { id: "POLO", itemName: "Polo Shirt", category: "Atasan", prices: { wash_press: 22000, press_only: 13000 }, defaultRoute: "in_house", active: true },
  { id: "TROUSER", itemName: "Celana Panjang", category: "Bawahan", prices: { wash_press: 30000, press_only: 18000, dry_clean: 40000 }, defaultRoute: "in_house", active: true },
  { id: "SHORTS", itemName: "Celana Pendek", category: "Bawahan", prices: { wash_press: 20000, press_only: 12000 }, defaultRoute: "in_house", active: true },
  { id: "SKIRT", itemName: "Rok", category: "Bawahan", prices: { wash_press: 28000, press_only: 16000, dry_clean: 40000 }, defaultRoute: "in_house", active: true },
  { id: "DRESS", itemName: "Dress / Gaun", category: "Setelan", prices: { press_only: 40000, dry_clean: 90000 }, defaultRoute: "vendor", active: true },
  { id: "BLAZER", itemName: "Jas / Blazer", category: "Setelan", prices: { press_only: 35000, dry_clean: 75000 }, defaultRoute: "vendor", active: true },
  { id: "BATIK", itemName: "Kemeja Batik", category: "Atasan", prices: { wash_press: 30000, press_only: 18000, dry_clean: 45000 }, defaultRoute: "in_house", active: true },
  { id: "KEBAYA", itemName: "Kebaya", category: "Setelan", prices: { press_only: 45000, dry_clean: 85000 }, defaultRoute: "vendor", active: true },
  { id: "JACKET", itemName: "Jaket", category: "Luaran", prices: { wash_press: 40000, dry_clean: 70000 }, defaultRoute: "vendor", active: true },
  { id: "SWEATER", itemName: "Sweater / Cardigan", category: "Luaran", prices: { wash_press: 35000, dry_clean: 55000 }, defaultRoute: "in_house", active: true },
  { id: "UNDERWEAR", itemName: "Pakaian Dalam", category: "Lainnya", prices: { wash_press: 12000 }, defaultRoute: "in_house", active: true },
  { id: "SOCKS", itemName: "Kaus Kaki (pasang)", category: "Lainnya", prices: { wash_press: 10000 }, defaultRoute: "in_house", active: true },
  { id: "PYJAMA", itemName: "Piyama (setel)", category: "Lainnya", prices: { wash_press: 30000, press_only: 18000 }, defaultRoute: "in_house", active: true },
  { id: "SCARF", itemName: "Selendang / Syal", category: "Lainnya", prices: { wash_press: 18000, dry_clean: 30000 }, defaultRoute: "in_house", active: true },
  { id: "TIE", itemName: "Dasi", category: "Lainnya", prices: { dry_clean: 25000 }, defaultRoute: "vendor", active: true },
  { id: "MUKENA", itemName: "Mukena", category: "Lainnya", prices: { wash_press: 35000 }, defaultRoute: "in_house", active: true },
];

export const KATEGORI = ["Atasan", "Bawahan", "Setelan", "Luaran", "Lainnya"];
