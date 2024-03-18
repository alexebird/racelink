import { toRaw } from 'vue'
import { defineStore } from 'pinia'
import _ from 'lodash'

function fileProtoAudioFname(audioFname) {
  const url = new URL(`file://${audioFname}`)
  url.searchParams.set('t', Date.now());
  return url.href
}

export const useAudioPlayerStore = defineStore('audioPlayer', {
  state: () => ({
    audioElement: null,
  }),
  actions: {
    setAudioElement(element) {
      this.audioElement = element
    },
    play(audioFname) {
      if (this.audioElement) {
        const url = fileProtoAudioFname(audioFname)
        console.log('audio file ready', url)

        this.audioElement.src = url
        this.audioElement.volume = 0.3
        this.audioElement.play()
          .catch(error => console.error("Error playing audio:", error))
      } else {
        console.error('audioElement was null')
      }
    },
  },
})
