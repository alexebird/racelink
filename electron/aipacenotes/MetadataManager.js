import fs from 'fs';
import path from 'path';
import { isEqual } from 'lodash';

const metadataFname = 'metadata.json'

// Function to store metadata
export function storeMetadata(audioFname, audioLen, pacenoteName) {
  const dirName = path.dirname(audioFname);
  const metadataPath = path.join(dirName, metadataFname);
  const baseName = path.basename(audioFname);

  let metadata = {};

  // Check if metadata file already exists and read its contents
  if (fs.existsSync(metadataPath)) {
    const rawData = fs.readFileSync(metadataPath);
    metadata = JSON.parse(rawData);
  }

  // Update or add the metadata for the pacenote
  audioLen = `${audioLen}`
  metadata[baseName] = { audioLen };

  // Write the updated metadata back to the file
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
}

// Function to perform garbage collection
// export function gcMetadata(dirName) {
//   // const dirName = path.dirname(audioFname);
//   const metadataPath = path.join(dirName, metadataFname);
//   // console.log(metadataPath)
//
//   if (!fs.existsSync(metadataPath)) return; // Exit if metadata file does not exist
//
//   const rawData = fs.readFileSync(metadataPath);
//   let metadata = JSON.parse(rawData);
//
//   // List all .ogg files in the directory
//   const oggFiles = fs.readdirSync(dirName).filter(file => path.extname(file) === '.ogg').map(file => path.basename(file));
//   // console.log(oggFiles)
//
//   // Filter out metadata entries for which the corresponding .ogg file does not exist
//   metadata = Object.entries(metadata).reduce((acc, [key, value]) => {
//     if (oggFiles.includes(key)) {
//       acc[key] = value; // Keep this entry
//     }
//     return acc;
//   }, {});
//
//   // Write the cleaned metadata back to the file
//   fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
// }


export function gcMetadata(dirName) {
  const metadataPath = path.join(dirName, metadataFname);

  if (!fs.existsSync(metadataPath)) return; // Exit if metadata file does not exist

  const rawData = fs.readFileSync(metadataPath, 'utf-8');
  const originalMetadata = JSON.parse(rawData);

  // List all .ogg files in the directory
  const oggFiles = fs.readdirSync(dirName).filter(file => path.extname(file) === '.ogg').map(file => path.basename(file));

  // Filter out metadata entries for which the corresponding .ogg file does not exist
  const newMetadata = Object.entries(originalMetadata).reduce((acc, [key, value]) => {
    if (oggFiles.includes(key)) {
      acc[key] = value; // Keep this entry
    }
    return acc;
  }, {});

  // Check if original and new metadata objects are equal using Lodash's isEqual
  if (!isEqual(originalMetadata, newMetadata)) {
    fs.writeFileSync(metadataPath, JSON.stringify(newMetadata, null, 2));
    console.log('Metadata updated.');
  } else {
    // console.log('No changes to metadata; not rewriting file.');
  }
}
