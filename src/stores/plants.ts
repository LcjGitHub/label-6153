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

    /**
     * 新增植物
     */
    function addPlant(payload: Omit<UserPlant, 'id'>) {
      const plant: UserPlant = {
        id: crypto.randomUUID(),
        ...payload,
      };
      items.value.unshift(plant);
      return plant;
    }

    /**
     * 更新植物
     */
    function updatePlant(id: string, payload: Omit<UserPlant, 'id'>) {
      const index = items.value.findIndex((p) => p.id === id);
      if (index === -1) return false;

      items.value[index] = { id, ...payload };
      return true;
    }

    /**
     * 删除植物
     */
    function removePlant(id: string) {
      const index = items.value.findIndex((p) => p.id === id);
      if (index === -1) return false;

      items.value.splice(index, 1);
      return true;
    }

    /**
     * 按 id 查找植物
     */
    function findById(id: string) {
      return items.value.find((p) => p.id === id) ?? null;
    }

    /**
     * 获取所有植物（浅拷贝）
     */
    function getAll(): UserPlant[] {
      return [...items.value];
    }

    /**
     * 整体替换植物列表
     */
    function replaceAll(newItems: UserPlant[]): void {
      items.value = [...newItems];
    }

    /**
     * 导入植物数据
     * @param incoming - 待导入的植物列表
     * @param mode - merge：合并（相同 ID 则更新），overwrite：覆盖现有
     */
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

    /**
     * 清空所有植物
     */
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
