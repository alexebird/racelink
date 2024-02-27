import fs from 'node:fs'
import path from 'node:path'


function cleanNameForPath(aString) {
  aString = aString.replace(/[^a-zA-Z0-9]/g, '_'); // Replace everything but letters and numbers with '_'
  aString = aString.replace(/_+/g, '_');           // Replace multiple consecutive '_' with a single '_'
  return aString;
}

function normalizePath(inPath) {
  // return path.normalize(inPath).replace(/\\/g, "/");
  return inPath
}

class Pacenote {
  constructor(notebook, noteData) {
    this.notebook = notebook
    this.noteData = noteData
  }

  noteHash() {
    const note = this.noteData.note
    // Assuming note is already a string; if not, you might need to encode it from UTF-16 to UTF-8.
    let hexString = ''
    for (let i = 0; i < note.length; i++) {
      hexString += note.charCodeAt(i).toString(16).padStart(2, '0')
    }

    let hashValue = 0
    for (let i = 0; i < hexString.length; i++) {
      hashValue = (hashValue * 33 + hexString.charCodeAt(i)) % 2147483647
    }
    return hashValue
  }

  noteBasename() {
    return `pacenote_${this.noteHash()}.ogg`
  }

  audioFname() {
    return path.join(this.notebook.pacenotesDir(), this.noteBasename())
  }
}

class Notebook {
  constructor(notebookPath) {
    this.notebookPath = notebookPath
    this.content = this._readNotebookFile()
    this._cachePacenotes()
  }

  codrivers() {
    return this.content.codrivers
  }

  _concatNoteData(noteData) {
    const AUTOFILL_BLOCKER = '#';
    const AUTOFILL_BLOCKER_INTERNAL = '<none>';
    const EMPTY_PLACEHOLDER = '[empty]';

    let before = noteData.before || '';
    if (before === AUTOFILL_BLOCKER || before === AUTOFILL_BLOCKER_INTERNAL) {
      before = '';
    }

    let note = noteData.note || '';
    if (note === AUTOFILL_BLOCKER || note === AUTOFILL_BLOCKER_INTERNAL) {
      note = '';
    }

    let after = noteData.after || '';
    if (after === AUTOFILL_BLOCKER || after === AUTOFILL_BLOCKER_INTERNAL) {
      after = '';
    }

    const rv = [before, note, after].join(' ').trim();
    if (rv === '') {
      return EMPTY_PLACEHOLDER;
    }

    return rv;
  }

  _staticPacenotes() {
    return []
  }

  _cachePacenotes() {
    this.cachedPacenotes = []

    this.codrivers().forEach(codriverData => {
      // Assuming `data['pacenotes']` and `notebookFile.staticPacenotes` are available in the context
      this.content.pacenotes.concat(this._staticPacenotes()).forEach(pacenoteData => {
        Object.entries(pacenoteData['notes']).forEach(([lang, noteData]) => {
          if (codriverData['language'] === lang) {
            let pnDataCopy = JSON.parse(JSON.stringify(pacenoteData)); // Deep copy equivalent
            pnDataCopy['note'] = this._concatNoteData(noteData);
            pnDataCopy['language'] = lang;
            pnDataCopy['codriver'] = codriverData; // Assuming deep copy is not necessary or codriverData is simple enough
            let pacenote = new Pacenote(this, pnDataCopy);
            this.cachedPacenotes.push(pacenote);
          }
        });
      });
    });
  }

  _readNotebookFile() {
    try {
      const data = fs.readFileSync(this.notebookPath, 'utf8')
      return JSON.parse(data)
    } catch (err) {
      console.error('Error reading notebook file:', err)
      return null
    }
  }

  basenameNoExt() {
    const match = this.notebookPath.match(/[\/\\]([^/\\]+)\.notebook\.json$/)
    const filename = match[1]
    return filename
  }

  dirname() {
    const dn = path.dirname(this.notebookPath)
    return dn
  }

  pacenotesDir() {
    return normalizePath(path.join(this.dirname(), 'generated_pacenotes', cleanNameForPath(this.basenameNoExt())))
  }

  updatePacenotes() {
    console.log(this.pacenotesDir())
    this.cachedPacenotes.forEach(pn => console.log(pn))
  }
}

export default Notebook
