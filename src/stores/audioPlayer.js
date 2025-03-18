import { toRaw } from 'vue'
import { defineStore } from 'pinia'
import _ from 'lodash'

function serverAudioUrl(audioFname) {
  // Encode the full path to use as a query parameter
  const encodedPath = encodeURIComponent(audioFname);
  // Extract just the filename for the route parameter
  const filename = audioFname.split(/[/\\]/).pop();
  // Create URL with cache-busting timestamp
  return `http://127.0.0.1:27872/audio/${filename}?path=${encodedPath}&t=${Date.now()}`;
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
        const url = serverAudioUrl(audioFname)
        console.log('audio file ready', url)

        this.audioElement.src = url
        // this.audioElement.volume = 0.3
        this.audioElement.play()
          .catch(error => console.error("Error playing audio:", error))
      } else {
        console.error('audioElement was null')
      }
    },
  },
})
