const AdmZip = require('adm-zip');

export default function readFileFromZip(zipFilePath, targetFileName) {
  const zip = new AdmZip(zipFilePath);
  const zipEntry = zip.getEntry(targetFileName);

  if (zipEntry) {
    // If the file is found in the zip archive, read its content as text
    const content = zipEntry.getData().toString('utf8');
    console.log(`Content of ${targetFileName}:`, content);
    return content;
  } else {
    console.log(`${targetFileName} not found in the zip archive.`);
    return null;
  }
}
