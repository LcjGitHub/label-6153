import type { MonthSuggestion, PlantCatalogItem, UserPlant, WeeklyCareTip } from '@/types';

const HIGH_ATTENTION_KEYWORDS = ['每天', '每日', '多次', '增加', '充足', '大量', '加强', '及时', '注意', '防止'];

function needsAttention(text: string): boolean {
  if (!text) return false;
  return HIGH_ATTENTION_KEYWORDS.some((keyword) => text.includes(keyword));
}

function generateWeeklyTip(
  plantName: string,
  suggestion: MonthSuggestion | null,
  catalogPlant: PlantCatalogItem | null,
): { tip: string; waterAdvice: string; fertilizeAdvice: string; sowAdvice: string; needWater: boolean; needFertilize: boolean } {
  if (!suggestion || !catalogPlant) {
    return {
      tip: '该植物暂未匹配到养护目录，请先在植物百科中确认品种信息。',
      waterAdvice: '',
      fertilizeAdvice: '',
      sowAdvice: '',
      needWater: false,
      needFertilize: false,
    };
  }

  const waterAdvice = suggestion.water || '保持正常浇水即可。';
  const fertilizeAdvice = suggestion.fertilize || '本月无需特别施肥。';
  const sowAdvice = suggestion.sow || '';

  const needWater = needsAttention(waterAdvice);
  const needFertilize = needsAttention(fertilizeAdvice);

  const attentionItems: string[] = [];
  if (needWater) attentionItems.push('浇水');
  if (needFertilize) attentionItems.push('施肥');

  const attentionText = attentionItems.length > 0 ? `，本周需重点关注${attentionItems.join('、')}` : '';

  const tips: string[] = [];
  if (waterAdvice) tips.push(`浇水：${waterAdvice}`);
  if (fertilizeAdvice) tips.push(`施肥：${fertilizeAdvice}`);
  if (sowAdvice) tips.push(`种植：${sowAdvice}`);

  const tip = `本周「${plantName}」养护要点${attentionText}。${tips.join('；')}。`;

  return {
    tip,
    waterAdvice,
    fertilizeAdvice,
    sowAdvice,
    needWater,
    needFertilize,
  };
}

export interface GenerateWeeklyTipsOptions {
  userPlants: UserPlant[];
  selectedCityId: string;
  currentMonth: number;
  findPlantByName: (name: string) => PlantCatalogItem | null;
  getSuggestionForCityPlantMonth: (cityId: string, plantId: string, month: number) => MonthSuggestion | null;
}

export function generateWeeklyTips(options: GenerateWeeklyTipsOptions): {
  matchedTips: WeeklyCareTip[];
  unmatchedTips: WeeklyCareTip[];
} {
  const { userPlants, selectedCityId, currentMonth, findPlantByName, getSuggestionForCityPlantMonth } = options;

  const matchedTips: WeeklyCareTip[] = [];
  const unmatchedTips: WeeklyCareTip[] = [];

  for (const plant of userPlants) {
    const catalogPlant = findPlantByName(plant.name);
    let suggestion: MonthSuggestion | null = null;

    if (catalogPlant) {
      suggestion = getSuggestionForCityPlantMonth(selectedCityId, catalogPlant.id, currentMonth);
    }

    const { tip, waterAdvice, fertilizeAdvice, sowAdvice, needWater, needFertilize } = generateWeeklyTip(
      plant.name,
      suggestion,
      catalogPlant,
    );

    const careTip: WeeklyCareTip = {
      plantId: plant.id,
      plantName: plant.name,
      plantVariety: plant.variety,
      catalogPlant,
      matched: !!catalogPlant,
      tip,
      needWaterAttention: needWater,
      needFertilizeAttention: needFertilize,
      waterAdvice,
      fertilizeAdvice,
      sowAdvice,
    };

    if (catalogPlant) {
      matchedTips.push(careTip);
    } else {
      unmatchedTips.push(careTip);
    }
  }

  return { matchedTips, unmatchedTips };
}
