import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { UserPlant } from '@/types';
import type { ImportMode } from '@/utils/importExport';

export interface PlantsImportResult {
  added: number;
  updated: number;
}

/**
 * 用户植物清单 Store（持久化 CRUD 数据）
 */
export const usePlantsStore = defineStore(
  'plants',
  () => {
    const items = ref<UserPlant[]>([]);

    function addPlant(payload: Omit<UserPlant, 'id'>) {
      const plant: UserPlant = {
        id: crypto.randomUUID(),
        ...payload,
      };
      items.value.unshift(plant);
      return plant;
    }

    function updatePlant(id: string, payload: Omit<UserPlant, 'id'>) {
      const index = items.value.findIndex((p) => p.id === id);
      if (index === -1) return false;

      items.value[index] = { id, ...payload };
      return true;
    }

    function removePlant(id: string) {
      const index = items.value.findIndex((p) => p.id === id);
      if (index === -1) return false;

      items.value.splice(index, 1);
      return true;
    }

    function findById(id: string) {
      return items.value.find((p) => p.id === id) ?? null;
    }

    function getAll(): UserPlant[] {
      return [...items.value];
    }

    function replaceAll(newItems: UserPlant[]): void {
      items.value = [...newItems];
    }

    function importPlants(
      incoming: UserPlant[],
      mode: ImportMode,
    ): PlantsImportResult {
      const result: PlantsImportResult = { added: 0, updated: 0 };

      if (mode === 'overwrite') {
        items.value = [...incoming];
        result.added = incoming.length;
        return result;
      }

      for (const plant of incoming) {
        const existingIdx = items.value.findIndex((p) => p.id === plant.id);
        if (existingIdx === -1) {
          items.value.push({ ...plant });
          result.added++;
        } else {
          items.value[existingIdx] = { ...plant };
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
      addPlant,
      updatePlant,
      removePlant,
      findById,
      getAll,
      replaceAll,
      importPlants,
      clearAll,
    };
  },
  {
    persist: {
      key: 'balcony-my-plants',
    },
  },
);
