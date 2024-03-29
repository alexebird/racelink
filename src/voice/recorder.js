import { useRallyStore } from "@/stores/rally"
import { useSettingsStore } from "@/stores/settings"

const mediaDeviceConf = {
  audio: {
    autoGainControl: false,
    noiseSuppression: false,
    echoCancellation: false,
  }
}

const stopRecordingDelayMs = 300

export default class Recorder {
  constructor() {
    this.cutHappened = false
    this.mediaRecorder = null
    this.lastCut = 0
    this.autocut = false
    this.cutId = -1

    // setInterval(() => {
    //   this.watchdog()
    // }, 1000)
  }

  createMediaRecorder(cb) {
    this.lastCut = Date.now()/1000
    this.autocut = false

    navigator.mediaDevices.getUserMedia(mediaDeviceConf)
      .then(stream => {
        useRallyStore().$patch({ recordingError: null })

        try {
          this.mediaRecorder = new MediaRecorder(stream);
          this.mediaRecorder.ondataavailable = (event) => {
            const audioChunks = []
            audioChunks.push(event.data)
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const reader = new FileReader();

            reader.onloadend = () => {
              window.electronAPI.writeAudioChunk(reader.result)

              if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
                this.onBufferingDone()
              }
            }

            reader.readAsArrayBuffer(audioBlob);
          }
          if (cb) {
            cb()
          }

          // this.mediaRecorder.onstop = () => {
          //   this.teardown()
          // }
        }
        catch (error) {
          console.error('error creating mediaRecorder', error)
          if (error.message.includes("Failed to construct 'MediaRecorder'")) {
            useRallyStore().$patch({ recordingError: "No input device found" })
          }
        }
      })
      .catch(error => {
        console.error('error setting up recording', error)
        if (error.message.includes("Requested device not found")) {
          useRallyStore().$patch({ recordingError: "No input device found" })
        }
      })
  }

  onBufferingDone() {
    window.electronAPI.closeAudioFile().then(() => {
      console.log('closeAudioFile done')
      if (this.autocut) {
        window.electronAPI.discardCurrentAudioRecordingFile()
      } else {
        window.electronAPI.transcribeAudioFile(this.cutId, useRallyStore().serializedSelectedMission).then((resp) => {
          if (resp) {
            useRallyStore().addTranscription(resp)
          }
        })
      }

      if (this.cutHappened) {
        this.cutHappened = false
        this.lastCut = Date.now()/1000
        this.startRecording()
      }
    })
  }

  teardown() {
    this.mediaRecorder = null
  }

  watchdog() {
    const now = Date.now()/1000
    const timeout = now - this.lastCut
    const threshold = useSettingsStore().autostopThreshold
    useRallyStore().$patch({ recordingAutostop: Math.round(threshold - timeout) })

    if (timeout > threshold) {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.autocut = true
        console.log('auto-stopping recording')
        this.stopRecording()
      }
    }
  }

  recordingStatus() {
    if (this.mediaRecorder) {
      return this.mediaRecorder.state
    } else {
      return 'none'
    }
  }

  isRecording() {
    return this.recordingStatus() === 'recording'
  }

  startRecording() {
    window.electronAPI.openRecordingFile().then(() => {
      this.createMediaRecorder(() => {
        if (this.mediaRecorder) {
          useRallyStore().$patch({ recordingStatus: 'recording' })
          this.mediaRecorder.start(1000)
        }
      })
    })
  }

  internalStopRecording() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop()
    }
  }

  stopRecording() {
    if (this.mediaRecorder) {
      useRallyStore().$patch({ recordingStatus: 'not_recording' })
      useRallyStore().clearTranscriptionHistory()
      this.mediaRecorder.stop()
    }
  }

  cutRecording(cutReq) {
    this.cutId = cutReq.cut_id
    this.cutHappened = true
    setTimeout(() => {
      this.internalStopRecording()
    }, stopRecordingDelayMs)
  }
}
