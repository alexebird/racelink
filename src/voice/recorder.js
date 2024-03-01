import { useRallyStore } from "@/stores/rally"

// const mediaDeviceConf = { audio: true }
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
        // this.audioChunks = null
        this.stream = null
        this.lastCut = 0
        this.autocut = false
        this.cutId = -1

        setInterval(() => {
            this.watchdog()
        }, 1000)
    }

    setup(callback) {
        navigator.mediaDevices.getUserMedia(mediaDeviceConf)
            .then(stream => {
                this.stream = stream
                if (callback) {
                    callback()
                }
            })
            .catch(error => {
                console.error('error setting up recording', error)
            })
    }

    createMediaRecorder() {
        this.lastCut = Date.now()/1000
        this.autocut = false
        this.mediaRecorder = new MediaRecorder(this.stream);
        this.mediaRecorder.ondataavailable = event => {
            const audioChunks = []
            audioChunks.push(event.data)
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const reader = new FileReader();

            reader.onloadend = () => {
                window.electronAPI.writeAudioChunk(reader.result)

                if (this.mediaRecorder.state === 'inactive') {
                    this.onBufferingDone()
                }
            }

            reader.readAsArrayBuffer(audioBlob);
        };

        // this.mediaRecorder.onstop = () => {
            // this.writeAudioChunks()
        // }
    }

    onBufferingDone() {
        window.electronAPI.closeAudioFile().then(() => {
            console.log('closeAudioFile done')
            if (this.autocut) {
                window.electronAPI.discardAudioFile()
            } else {
                window.electronAPI.transcribeAudioFile(this.cutId)
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
        // if (this.mediaRecorder) {
        //     console.log(this.mediaRecorder.state)
        // }

        const now = Date.now()/1000
        if (now - this.lastCut > 5) {
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
        window.electronAPI.openAudioFile().then(() => {
            useRallyStore().$patch({ recordingStatus: 'recording' })
            this.createMediaRecorder()
            this.mediaRecorder.start(1000)
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
            this.mediaRecorder.stop()
        }
    }

    // stopRecordingAfter() {
    //     setTimeout(() => {
    //         this.stopRecording()
    //     }, stopRecordingDelayMs)
    // }

    cutRecording(cutReq) {
        console.log(cutReq)
        this.cutId = cutReq.cut_id
        this.cutHappened = true
        setTimeout(() => {
            this.internalStopRecording()
        }, stopRecordingDelayMs)
    }
}
