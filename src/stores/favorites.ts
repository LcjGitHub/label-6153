import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { FavoriteCombination } from '@/types';

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

    return {
      items,
      sortedItems,
      isFavorite,
      addFavorite,
      removeFavorite,
      findById,
    };
  },
  {
    persist: {
      key: 'balcony-favorites',
    },
  },
);
