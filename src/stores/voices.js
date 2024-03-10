import { reactive, toRaw } from 'vue'
import { defineStore } from 'pinia'
import _ from 'lodash'

export const useVoicesStore = defineStore('voices', {
  state: () => ({
    defaultVoiceName: "en-GB-Neural2-A",
    form: {
      user_voice_name: 'My Voice',
      dropdownVoice: null,
      // dropdownVoice: {
      //   "display_name":"English (United Kingdom)",
      //   "language_code":"en-GB",
      //   "type":"gcp",
      //   "voice_name":"en-GB-Neural2-A",
      //   "voice_ssml_gender":"female",
      //   "country_code":"GB",
      //   "dropdown_display_name":"English (United Kingdom) (female, en-GB-Neural2-A)"
      // }
    },
    voiceData: null,
    voiceDataMapByVoiceName: null,
    userVoices: null,
    selectedUserVoice: null,
  }),
  getters: {
    dropdownVoices: (state) => {
      if (state.voiceData) {
        // console.log(state.voiceData)
        return state.voiceData.voices
      } else  {
        return []
      }
    },
    listboxUserVoices: (state) => {
      if (state.userVoices) {
        return _.toPairs(state.userVoices).map(([k,v]) => {
          return {
            name: k,
            data: v,
          }
        })
      } else  {
        return []
      }
    },

    // {
    //   "german_female": {
    //     "text_to_speech": {
    //       "type": "gcp",
    //       "language_code": "de-DE",
    //       "voice_name": "de-DE-Neural2-A",
    //       "dynamic_rate": {}
    //     }
    //   }
    // }
    formVoice: (state) => {
      const newVoice = {
          text_to_speech: {
            type: 'gcp',
            language_code: null,
            voice_name: null,
          }
        }

      let name = state.form.user_voice_name
      name = _.trim(name)

      if (name && name !== '') {
      } else {
        return null
      }

      let voice = state.form.dropdownVoice
      // console.log(JSON.stringify(voice))

      if (voice) {
        newVoice.text_to_speech.language_code = voice.language_code
        newVoice.text_to_speech.voice_name = voice.voice_name
      } else {
        return null
      }

      return [name, newVoice]
    },
  },
  actions: {
    loadVoiceData() {
      window.electronAPI.getVoiceStoreData().then((voiceData) => {
        this.voiceData = {voices: []}
        this.voiceDataMapByVoiceName = {}

        this.voiceData.voices = voiceData.voices.map((v) => {
          const parts = v.language_code.split('-');
          v.country_code = parts.length > 1 ? parts[1] : null
          v.dropdown_display_name = `${v.display_name} (${v.voice_ssml_gender}, ${v.voice_name})`
          if (v.voice_name === this.defaultVoiceName && !this.form.dropdownVoice) {
            this.form.dropdownVoice = v
          }

          this.voiceDataMapByVoiceName[v.voice_name] = v
          return v
        })
      })
    },
    updateUserVoices(name, voiceData) {
      this.userVoices[name] = voiceData
      this.setUserVoicesData()
    },
    loadUserVoiceData() {
      window.electronAPI.getUserVoices().then((userVoices) => {
        // console.log(userVoices)
        this.userVoices = userVoices
      })
    },
    setUserVoicesData() {
      window.electronAPI.setUserVoices(toRaw(this.userVoices)).then((userVoices) => {
        // console.log(userVoices)
        // this.userVoices = userVoices
      })
    },
    setFormToSelectedVoice() {
      if (!this.selectedUserVoice){
        this.form.user_voice_name = null
        this.form.dropdownVoice = null
        return
      }

      this.form.user_voice_name = this.selectedUserVoice.name
      const voice_name = this.selectedUserVoice.data.text_to_speech.voice_name
      // console.log(toRaw(this.selectedUserVoice.data))
      this.form.dropdownVoice = this.voiceDataMapByVoiceName[voice_name]
    },
    deleteSelectedUserVoice() {
      if (!this.selectedUserVoice) return

      const voiceName = this.selectedUserVoice.name
      delete this.userVoices[voiceName]
      this.setUserVoicesData()
    },
    newVoice() {
      this.selectedUserVoice = null

      // const voiceName = this.selectedUserVoice.name

      this.form.user_voice_name = "My Voice"
      this.form.dropdownVoice = this.voiceDataMapByVoiceName[this.defaultVoiceName]

      this.setUserVoicesData()
    },
  },
})
