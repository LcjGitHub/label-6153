import type { UserPlant, CareRecord, FavoriteCombination } from '@/types';

export const BACKUP_FILE_VERSION = 1;
export const BACKUP_FILE_MAGIC = 'balcony-garden-backup';

export interface BackupPreferences {
  selectedCityId: string;
  selectedPlantId: string;
  currentMonthISO: string;
}

export interface BackupData {
  magic: typeof BACKUP_FILE_MAGIC;
  version: typeof BACKUP_FILE_VERSION;
  exportedAt: string;
  plants: UserPlant[];
  careRecords: CareRecord[];
  favorites: FavoriteCombination[];
  preferences: BackupPreferences;
}

export interface ValidateResult {
  valid: boolean;
  error?: string;
  data?: BackupData;
}

export type ImportMode = 'merge' | 'overwrite';

export interface ImportStats {
  plantsAdded: number;
  plantsUpdated: number;
  careRecordsAdded: number;
  careRecordsUpdated: number;
  favoritesAdded: number;
  favoritesUpdated: number;
  preferencesImported: boolean;
}

export function createBackupData(payload: {
  plants: UserPlant[];
  careRecords: CareRecord[];
  favorites: FavoriteCombination[];
  preferences: BackupPreferences;
}): BackupData {
  return {
    magic: BACKUP_FILE_MAGIC,
    version: BACKUP_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    plants: payload.plants,
    careRecords: payload.careRecords,
    favorites: payload.favorites,
    preferences: payload.preferences,
  };
}

export function validateBackupData(raw: unknown): ValidateResult {
  if (raw === null || typeof raw !== 'object') {
    return { valid: false, error: '备份文件格式无效：根节点必须是对象' };
  }

  const obj = raw as Record<string, unknown>;

  if (obj.magic !== BACKUP_FILE_MAGIC) {
    return { valid: false, error: '备份文件格式无效：缺少标识头' };
  }

  if (typeof obj.version !== 'number' || obj.version < 1 || obj.version > BACKUP_FILE_VERSION) {
    return { valid: false, error: `备份文件版本不受支持（当前版本：${obj.version}）` };
  }

  if (typeof obj.exportedAt !== 'string') {
    return { valid: false, error: '备份文件格式无效：缺少导出时间' };
  }

  if (!Array.isArray(obj.plants)) {
    return { valid: false, error: '备份文件格式无效：plants 字段必须是数组' };
  }

  if (!Array.isArray(obj.careRecords)) {
    return { valid: false, error: '备份文件格式无效：careRecords 字段必须是数组' };
  }

  if (!Array.isArray(obj.favorites)) {
    return { valid: false, error: '备份文件格式无效：favorites 字段必须是数组' };
  }

  if (obj.preferences === null || typeof obj.preferences !== 'object') {
    return { valid: false, error: '备份文件格式无效：preferences 字段必须是对象' };
  }

  const prefs = obj.preferences as Record<string, unknown>;
  if (
    typeof prefs.selectedCityId !== 'string' ||
    typeof prefs.selectedPlantId !== 'string' ||
    typeof prefs.currentMonthISO !== 'string'
  ) {
    return { valid: false, error: '备份文件格式无效：preferences 字段不完整' };
  }

  for (const plant of obj.plants as unknown[]) {
    if (plant === null || typeof plant !== 'object') {
      return { valid: false, error: '备份文件格式无效：plants 数组中存在非对象项' };
    }
    const p = plant as Record<string, unknown>;
    if (
      typeof p.id !== 'string' ||
      typeof p.name !== 'string' ||
      typeof p.variety !== 'string' ||
      typeof p.addedAt !== 'string'
    ) {
      return { valid: false, error: '备份文件格式无效：plants 数组中存在字段缺失的项' };
    }
  }

  for (const rec of obj.careRecords as unknown[]) {
    if (rec === null || typeof rec !== 'object') {
      return { valid: false, error: '备份文件格式无效：careRecords 数组中存在非对象项' };
    }
    const r = rec as Record<string, unknown>;
    if (
      typeof r.id !== 'string' ||
      typeof r.plantId !== 'string' ||
      typeof r.plantName !== 'string' ||
      typeof r.date !== 'string' ||
      typeof r.type !== 'string' ||
      typeof r.remark !== 'string'
    ) {
      return { valid: false, error: '备份文件格式无效：careRecords 数组中存在字段缺失的项' };
    }
  }

  for (const fav of obj.favorites as unknown[]) {
    if (fav === null || typeof fav !== 'object') {
      return { valid: false, error: '备份文件格式无效：favorites 数组中存在非对象项' };
    }
    const f = fav as Record<string, unknown>;
    if (
      typeof f.id !== 'string' ||
      typeof f.cityId !== 'string' ||
      typeof f.cityName !== 'string' ||
      typeof f.plantId !== 'string' ||
      typeof f.plantName !== 'string' ||
      typeof f.createdAt !== 'string'
    ) {
      return { valid: false, error: '备份文件格式无效：favorites 数组中存在字段缺失的项' };
    }
  }

  return {
    valid: true,
    data: obj as unknown as BackupData,
  };
}

export function downloadBackupFile(data: BackupData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date(data.exportedAt).toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `balcony-garden-backup-${dateStr}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, 'utf-8');
  });
}

export function emptyImportStats(): ImportStats {
  return {
    plantsAdded: 0,
    plantsUpdated: 0,
    careRecordsAdded: 0,
    careRecordsUpdated: 0,
    favoritesAdded: 0,
    favoritesUpdated: 0,
    preferencesImported: false,
  };
}
