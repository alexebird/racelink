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
        this.mediaRecorder = null
        this.audioChunks = null
    }

    setup(callback) {
        navigator.mediaDevices.getUserMedia(mediaDeviceConf)
            .then(stream => {
                this.mediaRecorder = new MediaRecorder(stream);
                this.audioChunks = []

                this.mediaRecorder.ondataavailable = event => {
                    this.audioChunks.push(event.data)
                }

                this.mediaRecorder.onstop = () => {
                    this.writeAudioChunks()
                }

                callback()
            })
            .catch(error => {
                console.error('error setting up recording', error)
            })

    }

    teardown() {
        this.mediaRecorder = null
        this.audioChunks = null
    }

    writeAudioChunks() {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
            window.electronAPI.saveAudio(reader.result, 'output.webm');
        };
        reader.readAsArrayBuffer(audioBlob);
    }

    startRecording() {
        this.mediaRecorder.start()
    }

    stopRecording() {
        this.mediaRecorder.stop()
    }

    stopRecordingAfter() {
        setTimeout(() => {
            this.stopRecording()
        }, stopRecordingDelayMs)
    }
}
