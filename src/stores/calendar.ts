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
    const currentMonthISO = ref(dayjs().toISOString());

    const cities = computed(() => data.cities);
    const plants = computed(() => data.plants);

    const selectedCity = computed(
      () => cities.value.find((c) => c.id === selectedCityId.value) ?? null,
    );

    const selectedPlant = computed(
      () => plants.value.find((p) => p.id === selectedPlantId.value) ?? null,
    );

    const currentMonth = computed(() => dayjs(currentMonthISO.value));

    const currentMonthNumber = computed(() => currentMonth.value.month() + 1);

    function getNextCityId(cityId: string): string {
      const idx = cities.value.findIndex((c) => c.id === cityId);
      if (idx === -1) return cities.value[0]?.id ?? '';
      const nextIdx = (idx + 1) % cities.value.length;
      return cities.value[nextIdx]?.id ?? '';
    }

    function getSuggestionForMonth(month: number): MonthSuggestion | null {
      return getSuggestionForCityPlantMonth(
        selectedCityId.value,
        selectedPlantId.value,
        month,
      );
    }

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

    function findPlantByName(plantName: string): PlantCatalogItem | null {
      const trimmed = plantName.trim();
      return (
        plants.value.find((p) => p.name === trimmed) ??
        plants.value.find((p) => trimmed.includes(p.name) || p.name.includes(trimmed)) ??
        null
      );
    }

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

    function setCity(cityId: string) {
      selectedCityId.value = cityId;
    }

    function setPlant(plantId: string) {
      selectedPlantId.value = plantId;
    }

    function goPrevMonth() {
      currentMonthISO.value = dayjs(currentMonthISO.value)
        .subtract(1, 'month')
        .toISOString();
    }

    function goNextMonth() {
      currentMonthISO.value = dayjs(currentMonthISO.value)
        .add(1, 'month')
        .toISOString();
    }

    function goToday() {
      currentMonthISO.value = dayjs().toISOString();
    }

    function setPanelMonth(payload: { year: number; month: number }) {
      currentMonthISO.value = dayjs()
        .year(payload.year)
        .month(payload.month - 1)
        .date(1)
        .toISOString();
    }

    function getPreferences(): BackupPreferences {
      return {
        selectedCityId: selectedCityId.value,
        selectedPlantId: selectedPlantId.value,
        currentMonthISO: currentMonthISO.value,
      };
    }

    function importPreferences(
      prefs: BackupPreferences,
    ): CalendarPreferencesImportResult {
      const cityValid = cities.value.some((c) => c.id === prefs.selectedCityId);
      const plantValid = plants.value.some((p) => p.id === prefs.selectedPlantId);

      let applied = false;
      if (cityValid && plantValid) {
        selectedCityId.value = prefs.selectedCityId;
        selectedPlantId.value = prefs.selectedPlantId;
        if (typeof prefs.currentMonthISO === 'string') {
          currentMonthISO.value = prefs.currentMonthISO;
        }
        applied = true;
      }

      return { applied, cityValid, plantValid };
    }

    function resetPreferences(): void {
      selectedCityId.value = data.cities[0]?.id ?? '';
      selectedPlantId.value = data.plants[0]?.id ?? '';
      currentMonthISO.value = dayjs().toISOString();
    }

    return {
      selectedCityId,
      selectedPlantId,
      currentMonthISO,
      cities,
      plants,
      selectedCity,
      selectedPlant,
      currentMonth,
      currentMonthNumber,
      getNextCityId,
      getSuggestionForMonth,
      getSuggestionForCityPlantMonth,
      findPlantByName,
      getSuggestionForCityPlantNameMonth,
      setCity,
      setPlant,
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
        'currentMonthISO',
      ],
    },
  },
);
