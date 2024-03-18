import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getSettings: () => ipcRenderer.invoke('settingsGetAll'),
  setSetting: (key, value) => ipcRenderer.invoke('settingsSet', key, value),
  openFilePicker: () => ipcRenderer.send('openFilePicker'),
  openFileExplorer: (dirname) => ipcRenderer.send('openFileExplorer', dirname),
  deleteFile: (fname) => ipcRenderer.send('deleteFile', fname),
  onDirectorySelected: (callback) => ipcRenderer.on('directory-selected', callback),
  onNotebooksUpdated: (callback) => ipcRenderer.on('notebooks-updated', callback),
  loadModConfigFiles: () => ipcRenderer.invoke('loadModConfigFiles'),

  // voices
  refreshVoices: () => ipcRenderer.invoke('refreshVoices'),
  getVoiceManagerData: () => ipcRenderer.invoke('getVoiceManagerData'),
  getUserVoices: () => ipcRenderer.invoke('getUserVoices'),
  setUserVoices: (data) => ipcRenderer.invoke('setUserVoices', data),
  testVoice: (voiceConfig, text) => ipcRenderer.invoke('testVoice', voiceConfig, text),
  // onVoiceTestFileReady: (callback) => ipcRenderer.on('onVoiceTestFileReady', callback),

  scan: () => ipcRenderer.invoke('scannerScan'),
  missionGeneratePacenotes: (mission) => ipcRenderer.send('missionGeneratePacenotes', mission),

  openAudioFile: () => ipcRenderer.invoke('openAudioFile'),
  writeAudioChunk: (audioChunk) => ipcRenderer.send('writeAudioChunk', audioChunk),
  closeAudioFile: () => ipcRenderer.invoke('closeAudioFile'),

  transcribeAudioFile: (cutId, selectedMission) => ipcRenderer.send('transcribeAudioFile', cutId, selectedMission),
  discardCurrentAudioRecordingFile: () => ipcRenderer.send('discardCurrentAudioRecordingFile'),
  onTranscribeDone: (callback) => ipcRenderer.on('transcribe-done', (_event, value) => callback(value)),
  onServerRecordingCut: (callback) => ipcRenderer.on('server-recording-cut', (_event, value) => callback(value)),
  //TODO make as may ipcRenderer.on into invoke as possible
})
