// ============================================================================
// HỢP ĐỒNG TYPE DÙNG CHUNG — khớp api-contract.md + backend shared/socket-events.types.ts
// Khi ghép monorepo: xoá file này, đổi import '@/shared/...' thành '../../shared/...'
// Payload socket dùng camelCase. Response REST một số chỗ snake_case (xem api-contract Mục 2).
// ============================================================================

// enum SosType THẬT (api-contract Mục 2 — POST /api/sos)
export type SosType =
  | 'flood'
  | 'landslide'
  | 'accident'
  | 'medical'
  | 'fire'
  | 'lost'
  | 'drowning'
  | 'agricultural'
  | 'adventure'
  | 'other'

// 7 trạng thái SOS (api-contract — transition assigned→in_progress→arrived→resolved + pending/cancelled/false_alarm)
export type SosStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'arrived'
  | 'resolved'
  | 'cancelled'
  | 'false_alarm'

export type UserRole = 'victim' | 'rescuer' | 'commander'

export type RescueTeamStatus = 'available' | 'busy' | 'offline'

// ---- Payload Server → Client (camelCase) ----

export interface SosNewPayload {
  id: string
  victimId: string
  type: SosType
  status: SosStatus
  lat: number
  lng: number
  wardCode: string
  description: string | null
  createdAt: string
}

export interface SosUpdatedPayload {
  id: string
  status: SosStatus
  assignedTeamId: string | null
  updatedAt: string
}

export interface TeamLocationPayload {
  teamId: string
  lat: number
  lng: number
  updatedAt: string
}

export interface SystemNotificationPayload {
  level: 'info' | 'warning' | 'danger'
  message: string
  createdAt: string
}