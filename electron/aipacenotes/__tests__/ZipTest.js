const BeamUserDir = require('./electron/aipacenotes/BeamUserDir')

test("test zip file reading", async function () {
  // Usage example
  // Replace 'your_beam_directory_path_here' with the actual path to the beam directory
  const beamUserDir = new BeamUserDir('your_beam_directory_path_here');
  beamUserDir.loadAndMergeJson().then(mergedJson => {
    console.log('Merged JSON:', mergedJson);
  });
  // expect(1).toBe(1)
});
