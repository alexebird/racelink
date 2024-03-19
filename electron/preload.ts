import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // settings
  // loadModConfigFiles: () => ipcRenderer.invoke('loadModConfigFiles'),
  getSettings: () => ipcRenderer.invoke('settingsGetAll'),
  setSetting: (key, value) => ipcRenderer.invoke('settingsSet', key, value),

  // file explorer stuff
  openFileExplorer: (dirname) => ipcRenderer.send('openFileExplorer', dirname),
  selectDirectory: () => ipcRenderer.invoke('selectDirectory'),

  // voices tab
  refreshVoices: () => ipcRenderer.invoke('refreshVoices'),
  getVoiceManagerData: () => ipcRenderer.invoke('getVoiceManagerData'),
  getUserVoices: () => ipcRenderer.invoke('getUserVoices'),
  setUserVoices: (data) => ipcRenderer.invoke('setUserVoices', data),
  testVoice: (voiceConfig, text) => ipcRenderer.invoke('testVoice', voiceConfig, text),

  // mission and notebook scanning
  scanMissions: () => ipcRenderer.invoke('scanMissions'),
  missionGeneratePacenotes: (mission) => ipcRenderer.send('missionGeneratePacenotes', mission),
  onNotebooksUpdated: (callback) => ipcRenderer.on('notebooksUpdated', callback),
  rmNotebooksUpdated: (callback) => ipcRenderer.removeAllListeners('notebooksUpdated'),
  regeneratePacenote: (mission, fname) => ipcRenderer.send('regeneratePacenote', mission, fname),

  // recording
  openRecordingFile: () => ipcRenderer.invoke('openRecordingFile'),
  writeAudioChunk: (audioChunk) => ipcRenderer.send('writeAudioChunk', audioChunk),
  closeAudioFile: () => ipcRenderer.invoke('closeAudioFile'),
  transcribeAudioFile: (cutId, selectedMission) => ipcRenderer.handle('transcribeAudioFile', cutId, selectedMission),
  discardCurrentAudioRecordingFile: () => ipcRenderer.send('discardCurrentAudioRecordingFile'),
  onServerRecordingCut: (callback) => ipcRenderer.on('serverRecordingCut', (_event, value) => callback(value)),
  rmServerRecordingCut: () => ipcRenderer.removeAllListeners('serverRecordingCut'),
})
