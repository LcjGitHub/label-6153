import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { CareRecord } from '@/types';

export const useCareRecordsStore = defineStore(
  'careRecords',
  () => {
    const items = ref<CareRecord[]>([]);

    const sortedItems = computed(() =>
      [...items.value].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    );

    function addRecord(payload: Omit<CareRecord, 'id'>) {
      const record: CareRecord = {
        id: crypto.randomUUID(),
        ...payload,
      };
      items.value.unshift(record);
      return record;
    }

    function removeRecord(id: string) {
      const index = items.value.findIndex((r) => r.id === id);
      if (index === -1) return false;

      items.value.splice(index, 1);
      return true;
    }

    function findById(id: string) {
      return items.value.find((r) => r.id === id) ?? null;
    }

    return {
      items,
      sortedItems,
      addRecord,
      removeRecord,
      findById,
    };
  },
  {
    persist: {
      key: 'balcony-care-records',
    },
  },
);
