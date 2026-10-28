// Static development server with HTTP byte ranges for video seeking.
import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const portIndex = process.argv.indexOf('--port');
const port = portIndex >= 0 ? Number(process.argv[portIndex + 1]) : 4173;
const types = {'.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.mp4': 'video/mp4', '.webm': 'video/webm', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.csv': 'text/csv; charset=utf-8'};
const server = http.createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return; }
  let stream;
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const filename = path.resolve(root, '.' + pathname + (pathname.endsWith('/') ? 'index.html' : ''));
    if (!filename.startsWith(root)) { response.writeHead(403); response.end(); return; }
    const info = await stat(filename);
    if (!info.isFile()) { response.writeHead(404); response.end(); return; }
    const headers = {'Content-Type': types[path.extname(filename)] ?? 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache'};
    let start = 0;
    let end = info.size - 1;
    let status = 200;
    if (request.headers.range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
      if (!match || (!match[1] && !match[2])) { response.writeHead(416, {'Content-Range': `bytes */${info.size}`}); response.end(); return; }
      if (!match[1]) start = Math.max(0, info.size - Number(match[2]));
      else { start = Number(match[1]); if (match[2]) end = Math.min(Number(match[2]), end); }
      if (start > end || start >= info.size) { response.writeHead(416, {'Content-Range': `bytes */${info.size}`}); response.end(); return; }
      status = 206;
      headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
    }
    headers['Content-Length'] = Math.max(0, end - start + 1);
    response.writeHead(status, headers);
    if (request.method === 'HEAD' || info.size === 0) { response.end(); return; }
    stream = createReadStream(filename, {start, end});
    stream.on('error', () => response.destroy());
    response.on('close', () => stream.destroy());
    stream.pipe(response);
  } catch {
    if (!response.headersSent) response.writeHead(404, {'Content-Type': 'text/plain'});
    response.end('Not found');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}`));
