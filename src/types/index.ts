/** 城市信息 */
export interface City {
  id: string;
  name: string;
  climate: string;
}

/** Mock 植物目录项 */
export interface PlantCatalogItem {
  id: string;
  name: string;
  category: string;
}

/** 单月种植建议 */
export interface MonthSuggestion {
  sow: string;
  water: string;
  fertilize: string;
}

/** 用户植物记录 */
export interface UserPlant {
  id: string;
  name: string;
  variety: string;
  addedAt: string;
  remark?: string;
}

/** 养护类型 */
export type CareType = 'water' | 'fertilize' | 'repot';

/** 养护记录 */
export interface CareRecord {
  id: string;
  plantId: string;
  plantName: string;
  date: string;
  type: CareType;
  remark: string;
}

/** 收藏组合 */
export interface FavoriteCombination {
  id: string;
  cityId: string;
  cityName: string;
  plantId: string;
  plantName: string;
  createdAt: string;
}

/** 植物全年 12 个月种植建议，key 为月份 1-12 */
export interface YearlyPlantSuggestions {
  [month: number]: MonthSuggestion;
}

/** 种植月历 Mock 数据结构 */
export interface PlantingCalendarData {
  cities: City[];
  plants: PlantCatalogItem[];
  suggestions: Record<string, Record<string, Record<string, MonthSuggestion>>>;
}

/** 单株植物本周养护提示 */
export interface WeeklyCareTip {
  plantId: string;
  plantName: string;
  plantVariety: string;
  catalogPlant: PlantCatalogItem | null;
  matched: boolean;
  tip: string;
  needWaterAttention: boolean;
  needFertilizeAttention: boolean;
  waterAdvice: string;
  fertilizeAdvice: string;
  sowAdvice: string;
}
