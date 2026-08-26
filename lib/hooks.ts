"use client";
import { useEffect, useState } from "react";
import { pantauNota, pantauKendala, ambilSettings } from "./data";
import { DEFAULT_SETTINGS } from "./status";
import type { LaundryOrder, LaundryIssue, OrderStatus, AppSettings } from "./types";

/** Ambil pengaturan sistem (jam cut-off, SLA, dll). */
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let hidup = true;
    ambilSettings()
      .then((s) => hidup && setSettings(s))
      .finally(() => hidup && setLoading(false));
    return () => {
      hidup = false;
    };
  }, []);
  return { settings, loading, setSettings };
}

/** Dengarkan perubahan nota secara langsung (real-time). */
export function useOrders(statuses?: OrderStatus[], batas = 300) {
  const [orders, setOrders] = useState<LaundryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const kunci = (statuses || []).join(",");

  useEffect(() => {
    setLoading(true);
    const unsub = pantauNota(
      { statuses: kunci ? (kunci.split(",") as OrderStatus[]) : undefined, batas },
      (rows) => {
        setOrders(rows);
        setLoading(false);
      },
      (e) => {
        setError(pesanRamah(e));
        setLoading(false);
      }
    );
    return () => unsub();
  }, [kunci, batas]);

  return { orders, loading, error };
}

export function useIssues() {
  const [issues, setIssues] = useState<LaundryIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const unsub = pantauKendala(
      (rows) => {
        setIssues(rows);
        setLoading(false);
      },
      (e) => {
        setError(pesanRamah(e));
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);
  return { issues, loading, error };
}

/** Ubah pesan error teknis Firebase menjadi kalimat yang dimengerti staf. */
export function pesanRamah(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e);
  if (m.includes("permission-denied") || m.includes("Missing or insufficient"))
    return "Akses ditolak. Firestore Security Rules belum dipasang, atau peran akun Anda belum mencukupi.";
  if (m.includes("failed-precondition") || m.includes("requires an index"))
    return "Firestore meminta index tambahan. Buka pesan error di Console browser lalu klik tautan pembuatan index.";
  if (m.includes("unavailable")) return "Server sedang tidak terjangkau. Data akan tersinkron saat sinyal kembali.";
  return m;
}
