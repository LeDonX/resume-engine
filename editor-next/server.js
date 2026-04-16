import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const portFlagIndex = args.indexOf('--port');
const hostFlagIndex = args.indexOf('--host');
const port = portFlagIndex >= 0 ? Number(args[portFlagIndex + 1]) : 4173;
const host = hostFlagIndex >= 0 ? args[hostFlagIndex + 1] : '127.0.0.1';

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8'
};

function resolveRequestPath(urlPath) {
  const sanitizedPath = decodeURIComponent((urlPath || '/').split('?')[0]);
  const requestPath = sanitizedPath === '/' ? '/index.html' : sanitizedPath;
  const absolutePath = path.join(__dirname, requestPath);
  const relativePath = path.relative(__dirname, absolutePath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return null;
  }

  return absolutePath;
}

const server = createServer(async (request, response) => {
  const filePath = resolveRequestPath(request.url);

  if (!filePath) {
    response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('403 Forbidden');
    return;
  }

  try {
    const fileStat = await stat(filePath);
    const targetPath = fileStat.isDirectory() ? path.join(filePath, 'index.html') : filePath;
    const fileBuffer = await readFile(targetPath);
    const extension = path.extname(targetPath);
    const contentType = MIME_TYPES[extension] || 'application/octet-stream';

    response.writeHead(200, { 'Content-Type': contentType });
    response.end(fileBuffer);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('404 Not Found');
  }
});

server.listen(port, host, () => {
  console.log(`editor-next prototype available at http://${host}:${port}`);
});
