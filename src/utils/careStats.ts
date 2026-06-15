import type { CareRecord, CareType } from '@/types';

export interface CareTypeStats {
  type: CareType;
  label: string;
  count: number;
}

export interface PlantCareStats {
  plantName: string;
  totalCount: number;
  waterCount: number;
  fertilizeCount: number;
  repotCount: number;
}

export interface CareStatsSummary {
  totalRecords: number;
  typeStats: CareTypeStats[];
  plantStats: PlantCareStats[];
}

const careTypeLabelMap: Record<CareType, string> = {
  water: '浇水',
  fertilize: '施肥',
  repot: '换盆',
};

export function calculateCareStats(records: CareRecord[]): CareStatsSummary {
  const typeStats: CareTypeStats[] = [
    { type: 'water', label: careTypeLabelMap.water, count: 0 },
    { type: 'fertilize', label: careTypeLabelMap.fertilize, count: 0 },
    { type: 'repot', label: careTypeLabelMap.repot, count: 0 },
  ];

  const plantMap = new Map<string, PlantCareStats>();

  for (const record of records) {
    const typeStat = typeStats.find((s) => s.type === record.type);
    if (typeStat) {
      typeStat.count++;
    }

    if (!plantMap.has(record.plantName)) {
      plantMap.set(record.plantName, {
        plantName: record.plantName,
        totalCount: 0,
        waterCount: 0,
        fertilizeCount: 0,
        repotCount: 0,
      });
    }

    const plantStat = plantMap.get(record.plantName)!;
    plantStat.totalCount++;

    switch (record.type) {
      case 'water':
        plantStat.waterCount++;
        break;
      case 'fertilize':
        plantStat.fertilizeCount++;
        break;
      case 'repot':
        plantStat.repotCount++;
        break;
    }
  }

  const plantStats = [...plantMap.values()].sort((a, b) => b.totalCount - a.totalCount);

  return {
    totalRecords: records.length,
    typeStats,
    plantStats,
  };
}
