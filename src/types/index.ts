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
}

/** 种植月历 Mock 数据结构 */
export interface PlantingCalendarData {
  cities: City[];
  plants: PlantCatalogItem[];
  suggestions: Record<string, Record<string, Record<string, MonthSuggestion>>>;
}
