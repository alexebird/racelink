import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // settings
  // loadModConfigFiles: () => ipcRenderer.invoke('loadModConfigFiles'),
  getSettings: () => ipcRenderer.invoke('settingsGetAll'),
  setSetting: (key, value) => ipcRenderer.invoke('settingsSet', key, value),

  // toast
  onToast: (callback) => ipcRenderer.on('toastNotice', (_event, toast) => callback(toast)),

  // file explorer stuff
  openFileExplorer: (dirname) => ipcRenderer.send('openFileExplorer', dirname),
  openExternal: (url) => ipcRenderer.send('openExternal', url),
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
  rmNotebooksUpdated: () => ipcRenderer.removeAllListeners('notebooksUpdated'),
  regeneratePacenote: (mission, fname) => ipcRenderer.send('regeneratePacenote', mission, fname),
  // onPoke: (callback) => ipcRenderer.on('poke', (_event) => callback()),
  onTick: (callback) => ipcRenderer.on('tick', (_event) => callback()),
  rmTick: () => ipcRenderer.removeAllListeners('tick'),

  // recording
  openRecordingFile: () => ipcRenderer.invoke('openRecordingFile'),
  writeAudioChunk: (audioChunk) => ipcRenderer.send('writeAudioChunk', audioChunk),
  closeAudioFile: () => ipcRenderer.invoke('closeAudioFile'),
  transcribeAudioFile: (cutId, selectedMission) => ipcRenderer.invoke('transcribeAudioFile', cutId, selectedMission),
  discardCurrentAudioRecordingFile: () => ipcRenderer.send('discardCurrentAudioRecordingFile'),
  onServerRecordingCut: (callback) => ipcRenderer.on('serverRecordingCut', (_event, value) => callback(value)),
  rmServerRecordingCut: () => ipcRenderer.removeAllListeners('serverRecordingCut'),
})
