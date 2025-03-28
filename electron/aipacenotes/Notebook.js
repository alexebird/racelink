import fs from 'node:fs'
import path from 'node:path'
import { gcMetadata } from './MetadataManager'
import _ from 'lodash'
import { Pacenote, cleanNameForPath } from './Pacenote'
import crypto from 'crypto'

class Notebook {
  constructor(notebookPath, voices) {
    this.voices = voices
    this.notebookPath = notebookPath
    this.content = this._readNotebookFile()
    // console.log(JSON.stringify(this.content, null, 2))
    this.systemPacenotes = this.content.systemPacenotes
    this.fileHash = null
    try {
      this._cachePacenotes()
    } catch (err) {
      console.error('Error caching pacenotes:')
    }
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

    // Convert updated_at timestamp to a human-readable "ago" string
    let updatedAgo = '';
    if (this.content.updated_at) {
      const now = Math.floor(Date.now() / 1000);
      const diff = now - this.content.updated_at;
      
      if (diff < 60) {
        updatedAgo = `${diff} seconds ago`;
      } else if (diff < 3600) {
        updatedAgo = `${Math.floor(diff / 60)} minutes ago`;
      } else if (diff < 86400) {
        updatedAgo = `${Math.floor(diff / 3600)} hours ago`;
      } else if (diff < 604800) {
        updatedAgo = `${Math.floor(diff / 86400)} days ago`;
      } else {
        updatedAgo = `${Math.floor(diff / 604800)} weeks ago`;
      }
    } else {
      updatedAgo = 'unknown';
    }

    return {
      updatesCount: this.cachedPacenotes.filter((pn) => pn.needsUpdate()).length,
      pacenotesCount: this.cachedPacenotes.length,
      basename: this.basename(),
      name: this.content.name,
      pacenotes: children,
      pacenotesDir: this.pacenotesDir(),
      fileHash: this.fileHash,
      updatedAgo: updatedAgo,
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

  _cachePacenote(pnDataCopy, outputDir, noteText, lang, codriverData, pacenoteData) {
    pnDataCopy['note'] = noteText;
    pnDataCopy['language'] = lang;
    pnDataCopy['codriver'] = codriverData; // Assuming deep copy is not necessary or codriverData is simple enough
    pnDataCopy['metadata'] = pacenoteData.metadata || {};
    let pacenote = new Pacenote(this, outputDir, pnDataCopy);
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
      // Make sure to handle the case where this.systemPacenotes is null or undefined
      const pacenotes = this.content.pacenotes.concat(this.systemPacenotes || []);
      pacenotes.forEach(pacenoteData => {
        if (!pacenoteData) {
          console.error(`missing pacenoteData for pacenote ${pacenoteData}`)
          return
        }

        const notes = pacenoteData['notes']
        if (!notes) {
          console.error(`missing notes for pacenote ${pacenoteData.name}`)
          return
        }

        Object.entries(notes).forEach(([lang, langData]) => {
          if (codriverData['language'] === lang) {
            let outValue = this.finalNoteText(pacenoteData.metadata, langData)
            if (outValue) {
              if (typeof outValue === 'string') {
                outValue = { freeform: outValue }
              }

              if ('freeform' in outValue) {
                let pnDataCopy = _.cloneDeep(pacenoteData);
                const outputDir = pacenoteData.metadata.system ? 'system' : 'freeform'
                this._cachePacenote(pnDataCopy, outputDir, outValue.freeform, lang, codriverData, pacenoteData)
              }

              if ('structured' in outValue && Array.isArray(outValue.structured)) {
                outValue.structured.forEach((noteText, i) => {
                  let pnDataCopy = _.cloneDeep(pacenoteData);
                  pnDataCopy.name = `${pnDataCopy.name} [${i}]`
                  this._cachePacenote(pnDataCopy, 'structured', noteText, lang, codriverData, pacenoteData)
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
      this.fileHash = crypto.createHash('sha1').update(data).digest('hex');
      return JSON.parse(data)
    } catch (err) {
      console.error('Error reading notebook file:', err)
      this.fileHash = null;
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
    return path.join(this.dirname(), 'gen', cleanNameForPath(this.basenameNoExt()))
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
