const express = require('express')
const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  console.log(req.body);  // Print the JSON request body to the console
  res.json({ ok: true });
});

// expressApp.post('/print-json', (req, res) => {
//   console.log(req.body);  // Print the JSON request body to the console
//   res.json({ message: 'Received and printed the JSON body' });
// });

app.post('/recordings/actions/start', (req, res) => {
  if (serverThread.transcribeTab.recordingEnabled()) {
    serverThread.onRecordingStart();
    res.json({ ok: true });
  } else {
    res.json({ ok: false, error: 'recording is not enabled' });
  }
});

app.post('/recordings/actions/stop', (req, res) => {
  if (serverThread.transcribeTab.recordingEnabled()) {
    const createTranscript = false;
    serverThread.onRecordingStop(createTranscript);
    res.json({ ok: true });
  } else {
    res.json({ ok: false, error: 'recording is not enabled' });
  }
});

app.post('/recordings/actions/cut', (req, res) => {
  if (serverThread.transcribeTab.recordingEnabled()) {
    const vehicleData = req.body;
    serverThread.onRecordingCut(vehicleData);
    res.json({ ok: true });
  } else {
    res.json({ ok: false, error: 'recording is not enabled' });
  }
});

app.get('/transcripts/:count', (req, res) => {
  const count = req.params.count;
  const transcripts = serverThread.getTranscripts(count);
  res.json({
    ok: true,
    is_recording: serverThread.transcribeTab.isRecording(),
    transcripts: transcripts,
  });
});

function startServer() {
  app.listen(PORT, '0.0.0.0', () => console.log(`Express server running on port ${PORT}`));
}

export default startServer
