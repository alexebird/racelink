const express = require('express')
const app = express();
const PORT = 27872;

const callbacks = {
  onRecordingCut: () => {},
  onRecordingStart: () => {},
  onRecordingStop: () => {},
  onGetTranscripts: () => {},
}

app.use(express.json());

app.get('/health', (req, res) => {
  console.log(req.body);  // Print the JSON request body to the console
  res.json({ ok: true });
});

// app.post('/recordings/actions/start', (req, resp) => {
//   callbacks.onRecordingStart().then(() => {
//     resp.json({ ok: true });
//   })
// });
//
// app.post('/recordings/actions/stop', (req, resp) => {
//   callbacks.onRecordingStop().then(() => {
//     resp.json({ ok: true });
//   })
// });

app.post('/recordings/actions/cut', (req, resp) => {
  const vehicleData = req.body
  callbacks.onRecordingCut(vehicleData).then(() => {
    resp.json({ ok: true });
  })
});

app.get('/transcripts/:count', (req, resp) => {
  const count = req.params.count;
  // const transcripts = serverThread.getTranscripts(count);

  callbacks.onGetTranscripts(count).then((transcripts) => {
    resp.json({
      ok: true,
      is_recording: false,
      transcripts: transcripts,
    });
  })
});

app.post('/remoteAudio/playFile', (req, resp) => {
  const audioFname = req.body.audioFname
  callbacks.onRemoteAudioPlayFile(audioFname).then(() => {
    resp.json({ ok: true });
  })
});

app.post('/remoteAudio/reset', (req, resp) => {
  callbacks.onRemoteAudioReset().then(() => {
    resp.json({ ok: true });
  })
});

app.get('/remoteAudio/queueSize', (req, resp) => {
  callbacks.onRemoteAudioQueueSize().then((data) => {
    resp.json({
      ok: true,
      queueSize: data.queueSize,
      paused: data.paused,
    });
  })
});

function startServer(cbs) {
  // callbacks.onRecordingStart = () => {
  //   return new Promise((resolve, reject) => {
  //     try {
  //       cbs.onRecordingStart()
  //       resolve()
  //     }
  //     catch (error) {
  //       reject(error)
  //     }
  //   })
  // }
  //
  // callbacks.onRecordingStop = () => {
  //   return new Promise((resolve, reject) => {
  //     try {
  //       cbs.onRecordingStop()
  //       resolve()
  //     }
  //     catch (error) {
  //       reject(error)
  //     }
  //   })
  // }

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

  callbacks.onRemoteAudioPlayFile = (audioFname) => {
    return new Promise((resolve, reject) => {
      try {
        const rv = cbs.onRemoteAudioPlayFile(audioFname)
        resolve(rv)
      }
      catch (error) {
        reject(error)
      }
    })
  }

  callbacks.onRemoteAudioReset = () => {
    return new Promise((resolve, reject) => {
      try {
        const rv = cbs.onRemoteAudioReset()
        resolve(rv)
      }
      catch (error) {
        reject(error)
      }
    })
  }

  callbacks.onRemoteAudioQueueSize = () => {
    return new Promise((resolve, reject) => {
      try {
        const rv = cbs.onRemoteAudioQueueSize()
        resolve(rv)
      }
      catch (error) {
        reject(error)
      }
    })
  }

  app.listen(PORT, '127.0.0.1', () => console.log(`Express server running on port ${PORT}`));
}

export default startServer
