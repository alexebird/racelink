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
    }

    setup(callback) {
        navigator.mediaDevices.getUserMedia(mediaDeviceConf)
            .then(stream => {
                this.stream = stream
                callback()
            })
            .catch(error => {
                console.error('error setting up recording', error)
            })
    }

    createMediaRecorder() {
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
                } //else if (this.cutHappened) {
                //     this.cutHappened = false
                //     window.electronAPI.cutRecording()
                // }
            }

            reader.readAsArrayBuffer(audioBlob);
        };

        this.mediaRecorder.onstop = () => {
            // this.writeAudioChunks()
        }
    }

    onBufferingDone() {
        window.electronAPI.closeAudioFile().then(() => {
            console.log('closeAudioFile done')
            window.electronAPI.transcribeAudioFile()
            if (this.cutHappened) {
                this.cutHappened = false
                this.startRecording()
            }
        })
    }

    teardown() {
        this.mediaRecorder = null
        // this.audioChunks = null
    }

    // writeAudioChunks() {
    //     const fname = 'output.webm'
    //     const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
    //     const reader = new FileReader();
    //     reader.onloadend = () => {
    //         window.electronAPI.saveAudio(reader.result, fname);
    //     };
    //     reader.readAsArrayBuffer(audioBlob);
    //     this.audioChunks = []
    // }

    recordingStatus() {
        if (this.mediaRecorder) {
            return this.mediaRecorder.state
        } else {
            return 'null'
        }
    }

    startRecording() {
        // this.audioChunks = []
        window.electronAPI.openAudioFile().then(() => {
            this.createMediaRecorder()
            this.mediaRecorder.start(1000)
        })
    }

    stopRecording() {
        this.mediaRecorder.stop()
    }

    stopRecordingAfter() {
        setTimeout(() => {
            this.stopRecording()
        }, stopRecordingDelayMs)
    }

    cutRecording() {
        this.cutHappened = true
        this.stopRecordingAfter()
        // setTimeout(() => {
        //     this.stopRecording()
        // }, stopRecordingDelayMs)
    }
}
