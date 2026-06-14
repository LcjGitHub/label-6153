import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { UserPlant } from '@/types';

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

    return {
      items,
      addPlant,
      updatePlant,
      removePlant,
      findById,
    };
  },
  {
    persist: {
      key: 'balcony-my-plants',
    },
  },
);
