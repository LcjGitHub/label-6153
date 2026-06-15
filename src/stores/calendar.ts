import { defineStore } from 'pinia';
import dayjs from 'dayjs';
import { computed, ref, watch } from 'vue';
import calendarData from '@/mock/planting-calendar.json';
import type { MonthSuggestion, PlantCatalogItem, PlantingCalendarData } from '@/types';
import type { BackupPreferences } from '@/utils/importExport';

const data = calendarData as PlantingCalendarData;

export interface CalendarPreferencesImportResult {
  applied: boolean;
  cityValid: boolean;
  plantValid: boolean;
  categoryValid: boolean;
}

/**
 * 校验并修复植物与分类的一致性
 * 若当前选中植物不属于已选分类，自动切换为该分类下第一个植物
 */
function validatePlantCategoryConsistency(
  category: string,
  plantId: string,
): { category: string; plantId: string } {
  if (!category) return { category, plantId };
  const filtered = data.plants.filter((p) => p.category === category);
  if (filtered.length === 0) return { category: '', plantId };
  const currentValid = filtered.some((p) => p.id === plantId);
  if (!currentValid) {
    return { category, plantId: filtered[0].id };
  }
  return { category, plantId };
}

/**
 * 月历筛选与建议查询 Store（持久化用户选择）
 */
export const useCalendarStore = defineStore(
  'calendar',
  () => {
    const selectedCityId = ref(data.cities[0]?.id ?? '');
    const selectedPlantId = ref(data.plants[0]?.id ?? '');
    const selectedCategory = ref<string>('');
    const currentMonthISO = ref(dayjs().toISOString());
    const selectedDateISO = ref<string | null>(null);

    const cities = computed(() => data.cities);

    const allPlants = computed(() => data.plants);

    const categories = computed(() => {
      const set = new Set(data.plants.map((p) => p.category));
      return Array.from(set);
    });

    const plants = computed(() => {
      if (!selectedCategory.value) return data.plants;
      return data.plants.filter((p) => p.category === selectedCategory.value);
    });

    const selectedCity = computed(
      () => cities.value.find((c) => c.id === selectedCityId.value) ?? null,
    );

    const selectedPlant = computed(
      () => allPlants.value.find((p) => p.id === selectedPlantId.value) ?? null,
    );

    const currentMonth = computed(() => dayjs(currentMonthISO.value));

    const currentMonthNumber = computed(() => currentMonth.value.month() + 1);

    const selectedDate = computed(() =>
      selectedDateISO.value ? dayjs(selectedDateISO.value) : null,
    );

    /**
     * 获取指定城市在列表中的下一个城市
     * @param cityId - 当前城市 ID
     */
    function getNextCityId(cityId: string): string {
      const idx = cities.value.findIndex((c) => c.id === cityId);
      if (idx === -1) return cities.value[0]?.id ?? '';
      const nextIdx = (idx + 1) % cities.value.length;
      return cities.value[nextIdx]?.id ?? '';
    }

    /**
     * 获取指定月份的种植建议
     * @param month - 月份 1–12
     */
    function getSuggestionForMonth(month: number): MonthSuggestion | null {
      return getSuggestionForCityPlantMonth(
        selectedCityId.value,
        selectedPlantId.value,
        month,
      );
    }

    /**
     * 根据城市、植物和月份获取种植建议
     * @param cityId - 城市 ID
     * @param plantId - 植物 ID
     * @param month - 月份 1–12
     */
    function getSuggestionForCityPlantMonth(
      cityId: string,
      plantId: string,
      month: number,
    ): MonthSuggestion | null {
      const citySuggestions = data.suggestions[cityId];
      if (!citySuggestions) return null;

      const plantSuggestions = citySuggestions[plantId];
      if (!plantSuggestions) return null;

      return plantSuggestions[String(month)] ?? null;
    }

    /**
     * 按植物名称匹配目录植物（在完整植物目录中查找）
     * @param plantName - 植物名称
     */
    function findPlantByName(plantName: string): PlantCatalogItem | null {
      const trimmed = plantName.trim();
      return (
        allPlants.value.find((p) => p.name === trimmed) ??
        allPlants.value.find((p) => trimmed.includes(p.name) || p.name.includes(trimmed)) ??
        null
      );
    }

    /**
     * 根据城市、植物名称和月份获取种植建议（按名称匹配目录）
     * @param cityId - 城市 ID
     * @param plantName - 植物名称
     * @param month - 月份 1–12
     */
    function getSuggestionForCityPlantNameMonth(
      cityId: string,
      plantName: string,
      month: number,
    ): { plant: PlantCatalogItem | null; suggestion: MonthSuggestion | null } {
      const plant = findPlantByName(plantName);
      if (!plant) return { plant: null, suggestion: null };
      const suggestion = getSuggestionForCityPlantMonth(cityId, plant.id, month);
      return { plant, suggestion };
    }

    /**
     * 设置选中的城市
     */
    function setCity(cityId: string) {
      selectedCityId.value = cityId;
    }

    /**
     * 设置选中的植物
     */
    function setPlant(plantId: string) {
      selectedPlantId.value = plantId;
    }

    /**
     * 按植物名称选中目录中的植物（仅精确同名匹配）
     * @param plantName - 植物名称
     * @returns 是否匹配成功
     */
    function setPlantByName(plantName: string): boolean {
      const trimmed = plantName.trim();
      const plant = allPlants.value.find((p) => p.name === trimmed) ?? null;
      if (plant) {
        selectedPlantId.value = plant.id;
        selectedCategory.value = plant.category;
        return true;
      }
      return false;
    }

    /**
     * 设置选中的植物分类
     * 若当前已选植物不在该分类内则自动切换为该分类下第一个植物
     */
    function setCategory(category: string) {
      selectedCategory.value = category;
      if (category) {
        const filtered = data.plants.filter((p) => p.category === category);
        const currentValid = filtered.some((p) => p.id === selectedPlantId.value);
        if (!currentValid && filtered.length > 0) {
          selectedPlantId.value = filtered[0].id;
        }
      }
    }

    /**
     * 设置选中的具体日期
     * 会同步切换当前显示月份为该日期所属月份
     */
    function setSelectedDate(dateISO: string) {
      const d = dayjs(dateISO);
      selectedDateISO.value = d.toISOString();
      currentMonthISO.value = d.startOf('month').toISOString();
    }

    /**
     * 切换到上一个月
     */
    function goPrevMonth() {
      const prevMonth = dayjs(currentMonthISO.value).subtract(1, 'month');
      currentMonthISO.value = prevMonth.toISOString();
      if (selectedDateISO.value) {
        const sd = dayjs(selectedDateISO.value);
        const newDay = Math.min(sd.date(), prevMonth.daysInMonth());
        selectedDateISO.value = prevMonth.date(newDay).toISOString();
      }
    }

    /**
     * 切换到下一个月
     */
    function goNextMonth() {
      const nextMonth = dayjs(currentMonthISO.value).add(1, 'month');
      currentMonthISO.value = nextMonth.toISOString();
      if (selectedDateISO.value) {
        const sd = dayjs(selectedDateISO.value);
        const newDay = Math.min(sd.date(), nextMonth.daysInMonth());
        selectedDateISO.value = nextMonth.date(newDay).toISOString();
      }
    }

    /**
     * 回到当月
     */
    function goToday() {
      const today = dayjs();
      currentMonthISO.value = today.toISOString();
    }

    /**
     * 日历面板切换月份
     */
    function setPanelMonth(payload: { year: number; month: number }) {
      const newMonth = dayjs()
        .year(payload.year)
        .month(payload.month - 1)
        .date(1);
      currentMonthISO.value = newMonth.toISOString();
      if (selectedDateISO.value) {
        const sd = dayjs(selectedDateISO.value);
        const newDay = Math.min(sd.date(), newMonth.daysInMonth());
        selectedDateISO.value = newMonth.date(newDay).toISOString();
      }
    }

    /**
     * 获取当前月历偏好（城市、植物、分类、月份、选中日期），用于备份导出
     */
    function getPreferences(): BackupPreferences {
      return {
        selectedCityId: selectedCityId.value,
        selectedPlantId: selectedPlantId.value,
        selectedCategory: selectedCategory.value,
        currentMonthISO: currentMonthISO.value,
        selectedDateISO: selectedDateISO.value,
      };
    }

    /**
     * 导入月历偏好
     * @param prefs - 待导入的偏好
     * @returns 应用结果，包含城市/植物/分类是否在当前目录中有效
     */
    function importPreferences(
      prefs: BackupPreferences,
    ): CalendarPreferencesImportResult {
      const cityValid = cities.value.some((c) => c.id === prefs.selectedCityId);
      const plantValid = data.plants.some((p) => p.id === prefs.selectedPlantId);
      const categoryValid =
        typeof prefs.selectedCategory !== 'string' ||
        prefs.selectedCategory === '' ||
        categories.value.includes(prefs.selectedCategory);

      let applied = false;
      if (cityValid && plantValid) {
        selectedCityId.value = prefs.selectedCityId;
        let category = '';
        if (typeof prefs.selectedCategory === 'string' && categoryValid) {
          category = prefs.selectedCategory;
        }
        const validated = validatePlantCategoryConsistency(category, prefs.selectedPlantId);
        selectedCategory.value = validated.category;
        selectedPlantId.value = validated.plantId;
        if (typeof prefs.currentMonthISO === 'string') {
          currentMonthISO.value = prefs.currentMonthISO;
        }
        if (typeof prefs.selectedDateISO === 'string') {
          selectedDateISO.value = prefs.selectedDateISO;
        } else if (prefs.selectedDateISO === null) {
          selectedDateISO.value = null;
        }
        applied = true;
      }

      return { applied, cityValid, plantValid, categoryValid };
    }

    /**
     * 重置月历偏好为默认值
     */
    function resetPreferences(): void {
      selectedCityId.value = data.cities[0]?.id ?? '';
      selectedPlantId.value = data.plants[0]?.id ?? '';
      selectedCategory.value = '';
      currentMonthISO.value = dayjs().toISOString();
      selectedDateISO.value = null;
    }

    /**
     * 持久化恢复后校验分类与植物一致性
     * pinia-plugin-persistedstate 恢复后触发一次
     */
    let hydrated = false;
    watch(
      [selectedCategory, selectedPlantId],
      () => {
        if (!hydrated) {
          hydrated = true;
          return;
        }
      },
      { flush: 'sync' },
    );

    function ensureConsistencyAfterHydrate() {
      const categoryValid =
        selectedCategory.value === '' ||
        categories.value.includes(selectedCategory.value);
      const plantValid = allPlants.value.some((p) => p.id === selectedPlantId.value);
      if (!categoryValid) {
        selectedCategory.value = '';
      }
      if (!plantValid) {
        selectedPlantId.value = allPlants.value[0]?.id ?? '';
      }
      const validated = validatePlantCategoryConsistency(
        selectedCategory.value,
        selectedPlantId.value,
      );
      selectedCategory.value = validated.category;
      selectedPlantId.value = validated.plantId;
    }

    return {
      selectedCityId,
      selectedPlantId,
      selectedCategory,
      currentMonthISO,
      selectedDateISO,
      cities,
      categories,
      allPlants,
      plants,
      selectedCity,
      selectedPlant,
      currentMonth,
      currentMonthNumber,
      selectedDate,
      getNextCityId,
      getSuggestionForMonth,
      getSuggestionForCityPlantMonth,
      findPlantByName,
      getSuggestionForCityPlantNameMonth,
      setCity,
      setPlant,
      setPlantByName,
      setCategory,
      setSelectedDate,
      goPrevMonth,
      goNextMonth,
      goToday,
      setPanelMonth,
      getPreferences,
      importPreferences,
      resetPreferences,
      ensureConsistencyAfterHydrate,
    };
  },
  {
    persist: {
      key: 'balcony-calendar-selection',
      pick: [
        'selectedCityId',
        'selectedPlantId',
        'selectedCategory',
        'currentMonthISO',
        'selectedDateISO',
      ],
    },
  },
);
