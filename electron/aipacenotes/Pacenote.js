import fs from 'node:fs'
import path from 'node:path'
import _ from 'lodash'
import crypto from 'node:crypto'

export function cleanNameForPath(aString) {
  aString = aString.replace(/[^a-zA-Z0-9]/g, '_'); // Replace everything but letters and numbers with '_'
  aString = aString.replace(/_+/g, '_');           // Replace multiple consecutive '_' with a single '_'
  return aString;
}

export class Pacenote {
  constructor(notebook, outputDir, noteData) {
    this.notebook = notebook
    this.outputDir = outputDir
    this.noteData = noteData
    this.fileExists = false
  }

  setFileExists() {
    this.fileExists = fs.existsSync(this.audioFname())
  }

  joinedNote() {
    return this.noteData.note
  }

  name() {
    return this.noteData.name
  }

  metadata() {
    return this.noteData.metadata
  }

  voice() {
    return this.noteData.codriver.voice
  }

  language() {
    return this.noteData.language
  }

  noteHash() {
    const hash = crypto.createHash('sha1')
    hash.update(this.noteData.note)
    return hash.digest('hex').substring(0, 16)
  }

  cleanCodriverName() {
    return cleanNameForPath(`${this.noteData.codriver.name}_${this.noteData.codriver.pk}`)
  }

  noteBasename() {
    return `pacenote_${this.noteHash()}.ogg`
  }

  audioFname() {
    return path.join(this.notebook.pacenotesDir(), this.cleanCodriverName(), this.outputDir, this.noteBasename())
  }

  needsUpdate() {
    return !this.fileExists && this.joinedNote() !== ''
  }
}