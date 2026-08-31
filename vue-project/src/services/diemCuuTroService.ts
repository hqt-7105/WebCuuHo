import { http } from './http'
import { CONFIG } from '@/config'
import type { DiemCuuTro } from '@/types'

export async function fetchDiemCuuTro(): Promise<DiemCuuTro[]> {
  const { data } = await http.get<DiemCuuTro[]>(CONFIG.endpoints.diemCuuTro)
  return data
}