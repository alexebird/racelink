const express = require('express')
const app = express();
const HOST = '127.0.0.1';
const PORT = 27872;
const path = require('path');
const fs = require('fs');

const callbacks = {
  onRecordingCut: () => {},
  onGetTranscripts: () => {},
}

app.use(express.json());

app.get('/health', (req, res) => {
  console.log(req.body);  // Print the JSON request body to the console
  res.json({ ok: true });
});

app.post('/recordings/actions/cut', (req, resp) => {
  const vehicleData = req.body
  callbacks.onRecordingCut(vehicleData).then(() => {
    resp.json({ ok: true });
  })
});

app.get('/transcripts/:count', (req, resp) => {
  const count = req.params.count;

  callbacks.onGetTranscripts(count).then((transcripts) => {
    resp.json({
      ok: true,
      is_recording: false,
      transcripts: transcripts,
    });
  })
});

// Add a new endpoint to serve audio files
app.get('/audio/:filename', (req, res) => {
  const filename = req.params.filename;
  // We use a query parameter to get the full path (encoded)
  const fullPath = decodeURIComponent(req.query.path || '');
  
  if (!fullPath) {
    return res.status(400).send('Missing path parameter');
  }
  
  // Security check to prevent directory traversal
  if (fullPath.includes('..')) {
    return res.status(403).send('Invalid path');
  }
  
  try {
    if (fs.existsSync(fullPath)) {
      res.setHeader('Content-Type', 'audio/mpeg');
      fs.createReadStream(fullPath).pipe(res);
    } else {
      res.status(404).send('File not found');
    }
  } catch (error) {
    console.error('Error serving audio file:', error);
    res.status(500).send('Server error');
  }
});

function startServer(cbs) {
  callbacks.onRecordingCut = (vehicleData) => {
    return new Promise((resolve, reject) => {
      try {
        cbs.onRecordingCut(vehicleData)
        resolve()
      }
      catch (error) {
        reject(error)
      }
    })
  }

  callbacks.onGetTranscripts = (count) => {
    return new Promise((resolve, reject) => {
      try {
        const rv = cbs.onGetTranscripts(count)
        resolve(rv)
      }
      catch (error) {
        reject(error)
      }
    })
  }

  app.listen(PORT, HOST, () => console.log(`Express server running on port ${PORT}`));
}

export default startServer
