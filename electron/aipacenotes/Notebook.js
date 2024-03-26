import fs from 'node:fs'
import path from 'node:path'
import { gcMetadata } from './MetadataManager'
import _ from 'lodash'

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

 // noteData: {
 //    metadata: {},
 //    name: 'Pacenote 5',
 //    notes: {
 //      english: [Object],
 //      french: [Object],
 //      german: [Object],
 //      russian: [Object],
 //      spanish: [Object]
 //    },
 //    oldId: 30,
 //    pacenoteWaypoints: [
 //      [Object], [Object],
 //      [Object], [Object],
 //      [Object], [Object],
 //      [Object], [Object]
 //    ],
 //    note: 'fotobar ?',
 //    language: 'french',
 //    codriver: {
 //      language: 'french',
 //      name: 'Cosette',
 //      oldId: 13,
 //      voice: 'french_female'
 //    }
 //  }
  cleanCodriverName() {
    return cleanNameForPath(`${this.noteData.codriver.name}_${this.noteData.language}_${this.noteData.codriver.voice}`)

    // return normalizePath(path.join(this.dirname(), 'generated_pacenotes', cleanNameForPath(this.basenameNoExt())))

    // return aipacenotes.clean_name_for_path(
    //   self.codriver_name() + '_'+self.language() + '_' + self.voice()
    // )
  }

  noteBasename() {
    return `pacenote_${this.noteHash()}.ogg`
  }

  audioFname() {
    return path.join(this.notebook.pacenotesDir(), this.cleanCodriverName(), this.noteBasename())
  }
}

class Notebook {
  constructor(notebookPath, voices, staticPacenotes) {
    this.voices = voices
    this.staticPacenotes = staticPacenotes.static_pacenotes
    this.notebookPath = notebookPath
    this.content = this._readNotebookFile()
    this._cachePacenotes()
  }

  codrivers() {
    return this.content.codrivers
  }

  toIpcData() {
    this.cachedPacenotes.forEach((pn) => {
      pn.setFileExists()
    })

    const children = this.cachedPacenotes.map((pn) => {
      return {
        name: pn.name(),
        note: pn.joinedNote(),
        language: pn.language(),
        voice: pn.voice(),
        audioFname: pn.audioFname(),
      }
    })

    return {
      updatesCount: this.cachedPacenotes.filter((pn) => !pn.fileExists).length,
      pacenotesCount: this.cachedPacenotes.length,
      basename: this.basename(),
      name: this.content.name,
      pacenotes: children,
      pacenotesDir: this.pacenotesDir(),
    }
  }

  // must be the same as the method in pacenote.lua with the same name.
  // _joinedNote2(noteData) {
  //
  //   const AUTOFILL_BLOCKER = '#';
  //   const AUTODIST_INTERNAL_LEVEL1 = '<none>'
  //   const EMPTY_PLACEHOLDER = '[empty]';
  //
  //   const default_punctuation_distance_call = '.'
  //   const var_dl = '{dl}'
  //   const var_dt = '{dt}'
  //
  //   let txt = '';
  //   if (!noteData) {
  //     return txt;
  //   }
  //
  //   const useNote = (text) => text &&
  //     text !== '' &&
  //     text !== AUTOFILL_BLOCKER &&
  //     text !== AUTODIST_INTERNAL_LEVEL1;
  //
  //   const note = noteData.note
  //   const before = noteData.before
  //   const after = noteData.after
  //
  //   if (useNote(note)) {
  //     txt = note;
  //   } else {
  //     return EMPTY_PLACEHOLDER
  //   }
  //
  //   if (!txt.includes(var_dl)) {
  //     txt = var_dl + ' ' + txt;
  //   }
  //
  //   txt = useNote(before) ?
  //     txt.replace(var_dl, before) :
  //     txt.replace(var_dl, '');
  //
  //   if (useNote(after)) {
  //     if (!txt.includes(var_dt)) {
  //       txt += ' ' + var_dt + default_punctuation_distance_call;
  //     }
  //     txt = txt.replace(var_dt, after);
  //   } else {
  //     txt = txt.replace(var_dt, '');
  //   }
  //
  //   // Trim string
  //   txt = txt.trim();
  //
  //   return txt;
  // }

  // _joinedNote(noteData) {
  //   const AUTOFILL_BLOCKER = '#';
  //   const AUTOFILL_BLOCKER_INTERNAL = '<none>';
  //   const EMPTY_PLACEHOLDER = '[empty]';
  //
  //   const default_punctuation_distance_call = '.'
  //   const var_dl = '{dl}'
  //   const var_dt = '{dt}'
  //
  //   let note = noteData.note || '';
  //   if (note === AUTOFILL_BLOCKER || note === AUTOFILL_BLOCKER_INTERNAL) {
  //     return EMPTY_PLACEHOLDER
  //   }
  //
  //   let before = noteData.before || '';
  //   if (before === AUTOFILL_BLOCKER || before === AUTOFILL_BLOCKER_INTERNAL) {
  //     before = '';
  //   }
  //
  //   let after = noteData.after || '';
  //   if (after === AUTOFILL_BLOCKER || after === AUTOFILL_BLOCKER_INTERNAL) {
  //     after = '';
  //   }
  //
  //   const rv = [before, note, after].join(' ').trim();
  //   if (rv === '') {
  //     return EMPTY_PLACEHOLDER;
  //   }
  //
  //   return rv;
  // }

  finalNoteText(metadata, langData) {
    if (langData._out) {
      return langData._out
    } else if (metadata && metadata.static && langData.note) {
      return langData.note
    }
  }

  _cachePacenotes() {
    this.cachedPacenotes = []

    this.codrivers().forEach(codriverData => {
      // Assuming `data['pacenotes']` and `notebookFile.staticPacenotes` are available in the context
      this.content.pacenotes.concat(this.staticPacenotes).forEach(pacenoteData => {
        Object.entries(pacenoteData['notes']).forEach(([lang, langData]) => {
          if (codriverData['language'] === lang) {
            let pnDataCopy = _.cloneDeep(pacenoteData);
            // pnDataCopy['note'] = this._joinedNote2(langData);
            const noteText = this.finalNoteText(pacenoteData.metadata, langData)
            if (noteText) {
              pnDataCopy['note'] = noteText;
              pnDataCopy['language'] = lang;
              pnDataCopy['codriver'] = codriverData; // Assuming deep copy is not necessary or codriverData is simple enough
              pnDataCopy['metadata'] = pacenoteData.metadata || {};
              let pacenote = new Pacenote(this, pnDataCopy);
              pacenote.setFileExists();
              this.cachedPacenotes.push(pacenote);
            } else {
              console.error(`missing notes.${lang}._out field for note ${pacenoteData.name}`);
            }
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

  basename() {
    const match = this.notebookPath.match(/[\/\\]([^/\\]+\.notebook\.json)$/)
    const filename = match[1]
    return filename
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
    this._cachePacenotes()

    // console.log(this.pacenotesDir())
    return this.cachedPacenotes.map(pn => {
      if (!pn.fileExists) {
        return pn
      } else {
        return null
      }
    }).filter(content => content !== null)
  }

  cleanUpAudioFiles() {
    this._cachePacenotes()

    const pacenotesDirPath = this.pacenotesDir(); // Assuming this returns the directory path
    let allOggFiles = new Set();
    let pacenoteFiles = new Set();
    let pacenoteDirs = new Set();

    // Recursive function to list all .ogg files
    const listOggFiles = (dir) => {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      files.forEach(file => {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
          listOggFiles(fullPath); // Recurse into subdirectories
        } else if (path.extname(file.name) === '.ogg') {
          allOggFiles.add(fullPath); // Store the full path for deletion
          const dirName = path.dirname(fullPath);
          pacenoteDirs.add(dirName)
        }
      });
    };

    // 1. List all .ogg files in the directory and subdirectories
    listOggFiles(pacenotesDirPath);

    // 2. Collect all pacenote filenames
    this.cachedPacenotes.forEach(pn => {
      const audioFname = pn.audioFname(); // Assuming this returns the full path of the file
      if (audioFname) {
        pacenoteFiles.add(audioFname);
      }
    });

    // 3. Perform a set difference to find .ogg files not associated with a pacenote
    let filesToDelete = new Set([...allOggFiles].filter(x => !pacenoteFiles.has(x)));

    // 4. Delete these files
    filesToDelete.forEach(file => {
      fs.unlinkSync(file);
      console.log(`Deleted file: ${file}`);
    });

    // 5. GC all pacenote dirs
    pacenoteDirs.forEach(pd => {
      gcMetadata(pd)
    });

  }
}

export default Notebook
