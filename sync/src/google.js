// sync/src/google.js
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const SHEETS = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE = 'https://www.googleapis.com/drive/v3';

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url.split('?')[0]} -> ${res.status} ${await res.text()}`);
  return res.json();
}

export async function fetchSheetRows({ sheetId, tab = 'Products', apiKey }) {
  const url = `${SHEETS}/${sheetId}/values/${encodeURIComponent(tab)}?key=${apiKey}`;
  const data = await getJson(url);
  return data.values || [];
}

export async function listDriveFolder({ folderId, apiKey }) {
  const files = [];
  let pageToken = '';
  do {
    const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const fields = encodeURIComponent('nextPageToken, files(id,name,mimeType,modifiedTime)');
    const url = `${DRIVE}/files?q=${q}&key=${apiKey}&fields=${fields}&pageSize=1000`
      + (pageToken ? `&pageToken=${pageToken}` : '');
    const data = await getJson(url);
    files.push(...(data.files || []));
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return files;
}

export async function downloadDriveFile({ fileId, apiKey, destPath }) {
  const url = `${DRIVE}/files/${fileId}?alt=media&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${fileId} -> ${res.status}`);
  await mkdir(dirname(destPath), { recursive: true });
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buf);
}
