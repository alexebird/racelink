const express = require('express')
const app = express();
const HOST = '127.0.0.1';
const PORT = 27872;

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
