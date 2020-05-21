import { Observable } from 'rxjs'
import { ShiftPresets } from './shift-presets'

export type ShiftPresetsRepository = {
  getForTenant(tenantId: string): Observable<ShiftPresets>
  put(entity: ShiftPresets): Promise<void>
}
