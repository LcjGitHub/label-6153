import { defineStore } from 'pinia';
import dayjs from 'dayjs';
import { computed, ref } from 'vue';
import calendarData from '@/mock/planting-calendar.json';
import type { MonthSuggestion, PlantCatalogItem, PlantingCalendarData } from '@/types';
import type { BackupPreferences } from '@/utils/importExport';

const data = calendarData as PlantingCalendarData;

export interface CalendarPreferencesImportResult {
  applied: boolean;
  cityValid: boolean;
  plantValid: boolean;
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
      () => plants.value.find((p) => p.id === selectedPlantId.value) ?? null,
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
     * 按植物名称匹配目录植物
     * @param plantName - 植物名称
     */
    function findPlantByName(plantName: string): PlantCatalogItem | null {
      const trimmed = plantName.trim();
      return (
        plants.value.find((p) => p.name === trimmed) ??
        plants.value.find((p) => trimmed.includes(p.name) || p.name.includes(trimmed)) ??
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
     * @returns 应用结果，包含城市/植物 ID 是否在当前目录中有效
     */
    function importPreferences(
      prefs: BackupPreferences,
    ): CalendarPreferencesImportResult {
      const cityValid = cities.value.some((c) => c.id === prefs.selectedCityId);
      const plantValid = data.plants.some((p) => p.id === prefs.selectedPlantId);

      let applied = false;
      if (cityValid && plantValid) {
        selectedCityId.value = prefs.selectedCityId;
        selectedPlantId.value = prefs.selectedPlantId;
        if (typeof prefs.selectedCategory === 'string') {
          selectedCategory.value = prefs.selectedCategory;
        }
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

      return { applied, cityValid, plantValid };
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

    return {
      selectedCityId,
      selectedPlantId,
      selectedCategory,
      currentMonthISO,
      selectedDateISO,
      cities,
      categories,
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
      setCategory,
      setSelectedDate,
      goPrevMonth,
      goNextMonth,
      goToday,
      setPanelMonth,
      getPreferences,
      importPreferences,
      resetPreferences,
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
