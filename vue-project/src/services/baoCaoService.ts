import { http } from './http'
import { CONFIG } from '@/config'
import type { BaoCaoSuCo } from '@/types'

export async function guiBaoCaoSuCo(baoCao: BaoCaoSuCo): Promise<BaoCaoSuCo> {
  const { data } = await http.post<BaoCaoSuCo>(CONFIG.endpoints.baoCaoSuCo, baoCao)
  return data
}