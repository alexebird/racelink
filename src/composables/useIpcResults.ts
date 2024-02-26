// import { useMissionsStore } from '@/stores/missions'
// const { ipcRenderer } = window.ipcRenderer

// export function useIpcResults() {
//   const missionsStore = useMissionsStore();
//
//   const handleScanResults = (_event, results) => {
//     missionsStore.setResults(results);
//   };
//
//   // Setup the IPC event listener
//   const setupIpcListener = () => {
//     // ipcRenderer.on('scan-results', handleScanResults);
//   };
//
//   // Cleanup to be called on component unmount
//   const cleanupIpcListener = () => {
//     // ipcRenderer.removeListener('scan-results', handleScanResults);
//   };
//
//   return { setupIpcListener, cleanupIpcListener };
// }
