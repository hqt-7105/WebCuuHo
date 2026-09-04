// Service gọi API đội cứu hộ. Backend trả { success, data, message } — unwrap .data.data.

import { http } from './http'
import { CONFIG } from '@/config'
import type { RescueTeam } from '@/types'

export async function fetchRescueTeams(): Promise<RescueTeam[]> {
  const { data } = await http.get(CONFIG.endpoints.rescueTeams)
  return data.data as RescueTeam[]
}