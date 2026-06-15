import { describe, it, expect } from 'vitest';
import {
  BACKUP_FILE_VERSION,
  BACKUP_FILE_MAGIC,
  createBackupData,
  validateBackupData,
  type BackupData,
  type BackupPreferences,
  type UserPlant,
} from './importExport';

const validPreferences: BackupPreferences = {
  selectedCityId: 'city-1',
  selectedPlantId: 'plant-1',
  currentMonthISO: '2024-06',
};

const validPlants: UserPlant[] = [
  {
    id: 'plant-1',
    name: '番茄',
    variety: '圣女果',
    addedAt: '2024-01-01T00:00:00.000Z',
    remark: '阳台种植',
  },
  {
    id: 'plant-2',
    name: '辣椒',
    variety: '小米辣',
    addedAt: '2024-02-15T00:00:00.000Z',
  },
];

function createValidBackup(): BackupData {
  return {
    magic: BACKUP_FILE_MAGIC,
    version: BACKUP_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    plants: validPlants,
    preferences: validPreferences,
  };
}

describe('importExport - createBackupData', () => {
  it('应正确写入版本号', () => {
    const result = createBackupData({
      plants: validPlants,
      preferences: validPreferences,
    });
    expect(result.version).toBe(BACKUP_FILE_VERSION);
  });

  it('应正确写入标识头 magic', () => {
    const result = createBackupData({
      plants: validPlants,
      preferences: validPreferences,
    });
    expect(result.magic).toBe(BACKUP_FILE_MAGIC);
  });

  it('应正确写入导出时间 exportedAt', () => {
    const before = new Date();
    const result = createBackupData({
      plants: validPlants,
      preferences: validPreferences,
    });
    const after = new Date();

    const exportedDate = new Date(result.exportedAt);
    expect(exportedDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(exportedDate.getTime()).toBeLessThanOrEqual(after.getTime() + 1000);
  });

  it('应正确写入 plants 数据', () => {
    const result = createBackupData({
      plants: validPlants,
      preferences: validPreferences,
    });
    expect(result.plants).toEqual(validPlants);
  });

  it('应正确写入 preferences 数据', () => {
    const result = createBackupData({
      plants: validPlants,
      preferences: validPreferences,
    });
    expect(result.preferences).toEqual(validPreferences);
  });
});

describe('importExport - validateBackupData', () => {
  describe('合法数据', () => {
    it('完整合法的备份数据应通过校验', () => {
      const backup = createValidBackup();
      const result = validateBackupData(backup);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.data).toEqual(backup);
    });

    it('preferences 包含可选字段时应通过校验', () => {
      const backup = createValidBackup();
      backup.preferences = {
        ...validPreferences,
        selectedCategory: '蔬菜',
        selectedDateISO: '2024-06-15',
      };
      const result = validateBackupData(backup);
      expect(result.valid).toBe(true);
      expect(result.data?.preferences.selectedCategory).toBe('蔬菜');
      expect(result.data?.preferences.selectedDateISO).toBe('2024-06-15');
    });

    it('plants 数组为空时应通过校验', () => {
      const backup = createValidBackup();
      backup.plants = [];
      const result = validateBackupData(backup);
      expect(result.valid).toBe(true);
      expect(result.data?.plants).toEqual([]);
    });

    it('植物包含可选 remark 字段时应通过校验', () => {
      const backup = createValidBackup();
      backup.plants = [
        {
          id: 'plant-1',
          name: '番茄',
          variety: '圣女果',
          addedAt: '2024-01-01T00:00:00.000Z',
          remark: '备注信息',
        },
      ];
      const result = validateBackupData(backup);
      expect(result.valid).toBe(true);
      expect(result.data?.plants[0].remark).toBe('备注信息');
    });
  });

  describe('缺少标识头 magic', () => {
    it('magic 字段缺失时应返回错误', () => {
      const backup = createValidBackup();
      delete (backup as Record<string, unknown>).magic;
      const result = validateBackupData(backup);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('备份文件格式无效：缺少标识头');
      expect(result.data).toBeUndefined();
    });

    it('magic 字段值错误时应返回错误', () => {
      const backup = createValidBackup();
      (backup as Record<string, unknown>).magic = 'wrong-magic';
      const result = validateBackupData(backup);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('备份文件格式无效：缺少标识头');
    });

    it('magic 字段为数字时应返回错误', () => {
      const backup = createValidBackup();
      (backup as Record<string, unknown>).magic = 123;
      const result = validateBackupData(backup);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('备份文件格式无效：缺少标识头');
    });
  });

  describe('版本号校验', () => {
    it('版本号为 0 时应返回错误', () => {
      const backup = createValidBackup();
      backup.version = 0;
      const result = validateBackupData(backup);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('版本不受支持');
    });

    it('版本号高于当前版本时应返回错误', () => {
      const backup = createValidBackup();
      backup.version = BACKUP_FILE_VERSION + 1;
      const result = validateBackupData(backup);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('版本不受支持');
    });

    it('版本号为字符串时应返回错误', () => {
      const backup = createValidBackup();
      (backup as Record<string, unknown>).version = '1';
      const result = validateBackupData(backup);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('版本不受支持');
    });
  });

  describe('导出时间 exportedAt', () => {
    it('缺少 exportedAt 字段时应返回错误', () => {
      const backup = createValidBackup();
      delete (backup as Record<string, unknown>).exportedAt;
      const result = validateBackupData(backup);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('备份文件格式无效：缺少导出时间');
    });

    it('exportedAt 为数字时应返回错误', () => {
      const backup = createValidBackup();
      (backup as Record<string, unknown>).exportedAt = 1234567890;
      const result = validateBackupData(backup);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('备份文件格式无效：缺少导出时间');
    });
  });

  describe('plants 字段校验', () => {
    it('plants 字段缺失时应返回错误', () => {
      const backup = createValidBackup();
      delete (backup as Record<string, unknown>).plants;
      const result = validateBackupData(backup);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('备份文件格式无效：plants 字段必须是数组');
    });

    it('plants 为对象而非数组时应返回错误', () => {
      const backup = createValidBackup();
      (backup as Record<string, unknown>).plants = { '0': validPlants[0] };
      const result = validateBackupData(backup);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('备份文件格式无效：plants 字段必须是数组');
    });

    it('plants 数组中存在非对象项时应返回错误', () => {
      const backup = createValidBackup();
      (backup as Record<string, unknown>).plants = [validPlants[0], 'not-an-object'];
      const result = validateBackupData(backup);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('备份文件格式无效：plants 数组中存在非对象项');
    });

    it('plants 数组中存在 null 项时应返回错误', () => {
      const backup = createValidBackup();
      (backup as Record<string, unknown>).plants = [null];
      const result = validateBackupData(backup);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('备份文件格式无效：plants 数组中存在非对象项');
    });
  });

  describe('植物字段缺失', () => {
    it('植物缺少 id 字段时应返回错误', () => {
      const backup = createValidBackup();
      backup.plants = [
        {
          name: '番茄',
          variety: '圣女果',
          addedAt: '2024-01-01T00:00:00.000Z',
        } as UserPlant,
      ];
      const result = validateBackupData(backup);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('备份文件格式无效：plants 数组中存在字段缺失的项');
    });

    it('植物缺少 name 字段时应返回错误', () => {
      const backup = createValidBackup();
      backup.plants = [
        {
          id: 'plant-1',
          variety: '圣女果',
          addedAt: '2024-01-01T00:00:00.000Z',
        } as UserPlant,
      ];
      const result = validateBackupData(backup);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('备份文件格式无效：plants 数组中存在字段缺失的项');
    });

    it('植物缺少 variety 字段时应返回错误', () => {
      const backup = createValidBackup();
      backup.plants = [
        {
          id: 'plant-1',
          name: '番茄',
          addedAt: '2024-01-01T00:00:00.000Z',
        } as UserPlant,
      ];
      const result = validateBackupData(backup);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('备份文件格式无效：plants 数组中存在字段缺失的项');
    });

    it('植物缺少 addedAt 字段时应返回错误', () => {
      const backup = createValidBackup();
      backup.plants = [
        {
          id: 'plant-1',
          name: '番茄',
          variety: '圣女果',
        } as UserPlant,
      ];
      const result = validateBackupData(backup);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('备份文件格式无效：plants 数组中存在字段缺失的项');
    });

    it('植物字段类型错误（id 为数字）时应返回错误', () => {
      const backup = createValidBackup();
      backup.plants = [
        {
          id: 123,
          name: '番茄',
          variety: '圣女果',
          addedAt: '2024-01-01T00:00:00.000Z',
        } as unknown as UserPlant,
      ];
      const result = validateBackupData(backup);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('备份文件格式无效：plants 数组中存在字段缺失的项');
    });
  });

  describe('preferences 字段校验', () => {
    it('preferences 字段缺失时应返回错误', () => {
      const backup = createValidBackup();
      delete (backup as Record<string, unknown>).preferences;
      const result = validateBackupData(backup);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('备份文件格式无效：preferences 字段必须是对象');
    });

    it('preferences 为 null 时应返回错误', () => {
      const backup = createValidBackup();
      (backup as Record<string, unknown>).preferences = null;
      const result = validateBackupData(backup);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('备份文件格式无效：preferences 字段必须是对象');
    });

    it('preferences 为数组时应返回错误', () => {
      const backup = createValidBackup();
      (backup as Record<string, unknown>).preferences = [];
      const result = validateBackupData(backup);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('备份文件格式无效：preferences 字段不完整');
    });
  });

  describe('偏好字段不完整', () => {
    it('缺少 selectedCityId 时应返回错误', () => {
      const backup = createValidBackup();
      backup.preferences = {
        selectedPlantId: 'plant-1',
        currentMonthISO: '2024-06',
      } as BackupPreferences;
      const result = validateBackupData(backup);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('备份文件格式无效：preferences 字段不完整');
    });

    it('缺少 selectedPlantId 时应返回错误', () => {
      const backup = createValidBackup();
      backup.preferences = {
        selectedCityId: 'city-1',
        currentMonthISO: '2024-06',
      } as BackupPreferences;
      const result = validateBackupData(backup);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('备份文件格式无效：preferences 字段不完整');
    });

    it('缺少 currentMonthISO 时应返回错误', () => {
      const backup = createValidBackup();
      backup.preferences = {
        selectedCityId: 'city-1',
        selectedPlantId: 'plant-1',
      } as BackupPreferences;
      const result = validateBackupData(backup);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('备份文件格式无效：preferences 字段不完整');
    });

    it('selectedCityId 为数字时应返回错误', () => {
      const backup = createValidBackup();
      (backup.preferences as Record<string, unknown>).selectedCityId = 123;
      const result = validateBackupData(backup);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('备份文件格式无效：preferences 字段不完整');
    });

    it('selectedPlantId 为数字时应返回错误', () => {
      const backup = createValidBackup();
      (backup.preferences as Record<string, unknown>).selectedPlantId = 123;
      const result = validateBackupData(backup);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('备份文件格式无效：preferences 字段不完整');
    });

    it('currentMonthISO 为数字时应返回错误', () => {
      const backup = createValidBackup();
      (backup.preferences as Record<string, unknown>).currentMonthISO = 202406;
      const result = validateBackupData(backup);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('备份文件格式无效：preferences 字段不完整');
    });
  });

  describe('根节点校验', () => {
    it('输入为 null 时应返回错误', () => {
      const result = validateBackupData(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('备份文件格式无效：根节点必须是对象');
    });

    it('输入为 undefined 时应返回错误', () => {
      const result = validateBackupData(undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('备份文件格式无效：根节点必须是对象');
    });

    it('输入为字符串时应返回错误', () => {
      const result = validateBackupData('not-an-object');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('备份文件格式无效：根节点必须是对象');
    });

    it('输入为数字时应返回错误', () => {
      const result = validateBackupData(123);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('备份文件格式无效：根节点必须是对象');
    });

    it('输入为数组时应返回错误', () => {
      const result = validateBackupData([1, 2, 3]);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('备份文件格式无效：缺少标识头');
    });
  });
});
