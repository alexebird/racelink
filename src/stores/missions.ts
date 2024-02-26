import { defineStore } from 'pinia';

export const useMissionsStore = defineStore('missions', {
  state: () => ({
    results: [],
  }),
  actions: {
    setResults(newResults) {
      this.results = newResults;
    },
  },
});
