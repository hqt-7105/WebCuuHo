// Lớp bọc IndexedDB — CHỈ lo việc đọc/ghi hàng đợi, không biết gì về Pinia/Leaflet/UI.
// Dùng thư viện 'idb' để gọi IndexedDB bằng async/await thay vì callback kiểu cũ.

import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { QueuedBaoCao } from '@/types/offline'

interface OfflineDB extends DBSchema {
  'bao-cao-queue': {
    key: string
    value: QueuedBaoCao
  }
}

const DB_NAME = 'cuutro-offline-db'
const STORE_NAME = 'bao-cao-queue'

let dbPromise: Promise<IDBPDatabase<OfflineDB>> | null = null

function getDb() {
  // Chỉ mở kết nối 1 lần, tái sử dụng cho mọi lần gọi sau — mở lặp lại tốn tài nguyên
  // vô ích vì IndexedDB không đóng kết nối theo từng thao tác như fetch().
  if (!dbPromise) {
    dbPromise = openDB<OfflineDB>(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME, { keyPath: 'localId' })
      }
    })
  }
  return dbPromise
}

export async function themVaoHangDoi(baoCao: QueuedBaoCao): Promise<void> {
  const db = await getDb()
  await db.put(STORE_NAME, baoCao)
}

export async function layToanBoHangDoi(): Promise<QueuedBaoCao[]> {
  const db = await getDb()
  return db.getAll(STORE_NAME)
}

export async function xoaKhoiHangDoi(localId: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE_NAME, localId)
}