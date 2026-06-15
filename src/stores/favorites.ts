import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { FavoriteCombination } from '@/types';
import type { ImportMode } from '@/utils/importExport';

export interface FavoritesImportResult {
  added: number;
  updated: number;
}

export const useFavoritesStore = defineStore(
  'favorites',
  () => {
    const items = ref<FavoriteCombination[]>([]);

    const sortedItems = computed(() =>
      [...items.value].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    );

    function isFavorite(cityId: string, plantId: string): boolean {
      return items.value.some(
        (item) => item.cityId === cityId && item.plantId === plantId,
      );
    }

    function addFavorite(payload: {
      cityId: string;
      cityName: string;
      plantId: string;
      plantName: string;
    }): FavoriteCombination | null {
      if (isFavorite(payload.cityId, payload.plantId)) {
        return null;
      }

      const favorite: FavoriteCombination = {
        id: crypto.randomUUID(),
        cityId: payload.cityId,
        cityName: payload.cityName,
        plantId: payload.plantId,
        plantName: payload.plantName,
        createdAt: new Date().toISOString(),
      };
      items.value.unshift(favorite);
      return favorite;
    }

    function removeFavorite(id: string): boolean {
      const index = items.value.findIndex((item) => item.id === id);
      if (index === -1) return false;

      items.value.splice(index, 1);
      return true;
    }

    function findById(id: string): FavoriteCombination | null {
      return items.value.find((item) => item.id === id) ?? null;
    }

    function getAll(): FavoriteCombination[] {
      return [...items.value];
    }

    function replaceAll(newItems: FavoriteCombination[]): void {
      items.value = [...newItems];
    }

    function importFavorites(
      incoming: FavoriteCombination[],
      mode: ImportMode,
    ): FavoritesImportResult {
      const result: FavoritesImportResult = { added: 0, updated: 0 };

      if (mode === 'overwrite') {
        items.value = [...incoming];
        result.added = incoming.length;
        return result;
      }

      for (const fav of incoming) {
        const existingIdx = items.value.findIndex(
          (item) => item.cityId === fav.cityId && item.plantId === fav.plantId,
        );
        if (existingIdx === -1) {
          items.value.push({ ...fav });
          result.added++;
        } else {
          items.value[existingIdx] = { ...fav };
          result.updated++;
        }
      }

      return result;
    }

    function clearAll(): void {
      items.value = [];
    }

    return {
      items,
      sortedItems,
      isFavorite,
      addFavorite,
      removeFavorite,
      findById,
      getAll,
      replaceAll,
      importFavorites,
      clearAll,
    };
  },
  {
    persist: {
      key: 'balcony-favorites',
    },
  },
);
