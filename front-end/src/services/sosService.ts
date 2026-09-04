// Service SOS. Backend trả { success, data, message } — unwrap .data.data.
// Field response một số route snake_case, số khác camelCase (api-contract Mục 2) — mỗi
// hàm trả đúng shape route đó, không ép chung 1 interface.

import { http } from './http'
import { CONFIG } from '@/config'
import type { SosRequest, SosListItem, SosType, BaoCaoSuCo } from '@/types'

// POST /api/sos (role victim). KHÔNG gửi wardCode — backend tự suy từ lat/lng.
export async function guiSos(payload: {
  lat: number
  lng: number
  type: SosType
  description?: string
  imageUrl?: string
}) {
  const { data } = await http.post(CONFIG.endpoints.sos, payload)
  return data.data // { id, type, status, ward_code, created_at, cancel_deadline }
}

// GET /api/sos (role rescuer/commander) — danh sách tối đa 50, mới nhất trước.
export async function layDanhSachSos(status?: string): Promise<SosListItem[]> {
  const { data } = await http.get(CONFIG.endpoints.sos, { params: status ? { status } : {} })
  return data.data as SosListItem[]
}

// GET /api/sos/:id — chi tiết, kèm timeline (service tự kiểm quyền theo role).
export async function xemChiTietSos(id: string): Promise<SosRequest> {
  const { data } = await http.get(`${CONFIG.endpoints.sos}/${id}`)
  return data.data as SosRequest
}

// PATCH /api/sos/:id/cancel (role victim, chủ SOS). Body reason bắt buộc.
export async function huySos(id: string, reason: 'mistake' | 'resolved_myself' | 'other') {
  const { data } = await http.patch(`${CONFIG.endpoints.sos}/${id}/cancel`, { reason })
  return data.data // { sosId, status, penaltyApplied }
}

// PATCH /api/sos/:id/assign (role commander).
export async function phanCongDoi(id: string, teamId: string) {
  const { data } = await http.patch(`${CONFIG.endpoints.sos}/${id}/assign`, { teamId })
  return data.data
}

// PATCH /api/sos/:id/status (role rescuer, leader đội được assign).
export async function capNhatTienDo(
  id: string,
  status: 'in_progress' | 'arrived' | 'resolved',
  note?: string
) {
  const { data } = await http.patch(`${CONFIG.endpoints.sos}/${id}/status`, { status, note })
  return data.data
}

// ---- Cầu nối tạm (Phase 5.3) ----
// Giữ tên guiBaoCaoSuCo để offlineQueue.ts và MapView.vue chưa phải refactor. Chuyển
// BaoCaoSuCo (shape UI cũ) → payload guiSos thật. Sẽ bỏ ở Phase 5.4 khi luồng gửi dùng
// thẳng guiSos với đầy đủ type/toạ độ do người dùng chọn.
export async function guiBaoCaoSuCo(baoCao: BaoCaoSuCo) {
  // mucDo cũ ('Khẩn cấp'/'Cảnh báo') không map 1-1 sang SosType — tạm gán 'other'.
  return guiSos({ lat: baoCao.lat, lng: baoCao.lng, type: 'other', description: baoCao.ten })
}