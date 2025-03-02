import fs from 'node:fs'
import path from 'node:path'
import { gcMetadata } from './MetadataManager'
import _ from 'lodash'
import { Pacenote, cleanNameForPath } from './Pacenote'

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
      updatesCount: this.cachedPacenotes.filter((pn) => pn.needsUpdate()).length,
      pacenotesCount: this.cachedPacenotes.length,
      basename: this.basename(),
      name: this.content.name,
      pacenotes: children,
      pacenotesDir: this.pacenotesDir(),
    }
  }

  ensureArray(value) {
    return Array.isArray(value) ? value : [value];
  }

  finalNoteText(metadata, langData) {
    if (langData._out) {
      return langData._out
    } else if (metadata && metadata.static && langData.note) {
      return langData.note
    }
  }

  _cachePacenote(pnDataCopy, noteText, lang, codriverData, pacenoteData) {
    pnDataCopy['note'] = noteText;
    pnDataCopy['language'] = lang;
    pnDataCopy['codriver'] = codriverData; // Assuming deep copy is not necessary or codriverData is simple enough
    pnDataCopy['metadata'] = pacenoteData.metadata || {};
    // console.log(pnDataCopy)
    let pacenote = new Pacenote(this, pnDataCopy);
    pacenote.setFileExists();
    this.cachedPacenotes.push(pacenote);
  }

  _cachePacenotes() {
    this.cachedPacenotes = []

    if (!Array.isArray(this.content.pacenotes)) {
      // If this.content.pacenotes is not an array, return early and do nothing
      return;
    }

    this.codrivers().forEach(codriverData => {
      // Assuming `data['pacenotes']` and `notebookFile.staticPacenotes` are available in the context
      this.content.pacenotes.concat(this.staticPacenotes).forEach(pacenoteData => {
        Object.entries(pacenoteData['notes']).forEach(([lang, langData]) => {
          // if (pacenoteData.metadata.static) return
          if (codriverData['language'] === lang) {
            let outValue = this.finalNoteText(pacenoteData.metadata, langData)
            // console.log(outValue)
            if (outValue) {
              if (typeof outValue === 'string') {
                outValue = { freeform: outValue }
              }

              if ('freeform' in outValue) {
                let pnDataCopy = _.cloneDeep(pacenoteData);
                this._cachePacenote(pnDataCopy, outValue.freeform, lang, codriverData, pacenoteData)
              }

              if ('structured' in outValue && Array.isArray(outValue.structured)) {
                outValue.structured.forEach((noteText, i) => {
                  let pnDataCopy = _.cloneDeep(pacenoteData);
                  pnDataCopy.name = `${pnDataCopy.name} [${i}]`
                  // console.log(noteText, i)
                  this._cachePacenote(pnDataCopy, noteText, lang, codriverData, pacenoteData)
                })
              }

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
    return path.join(this.dirname(), 'generated_pacenotes', cleanNameForPath(this.basenameNoExt()))
  }

  updatePacenotes() {
    this._cachePacenotes()

    // console.log(this.pacenotesDir())
    return this.cachedPacenotes.map(pn => {
      if (pn.needsUpdate()) {
        // console.log(`updating pacenote: ${pn.joinedNote()}`)
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

    const listOggFiles = (dir) => {
      if (!fs.existsSync(dir)) {
        // console.error(`Directory does not exist: ${dir}`);
        return;
      }

      try {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        files.forEach(file => {
          const fullPath = path.join(dir, file.name);
          if (file.isDirectory()) {
            listOggFiles(fullPath); // Recurse into subdirectories
          } else if (path.extname(file.name) === '.ogg') {
            allOggFiles.add(fullPath); // Store the full path for deletion
            const dirName = path.dirname(fullPath);
            pacenoteDirs.add(dirName);
          }
        });
      } catch (error) {
        console.error(`Error reading directory: ${dir}`, error);
      }
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
