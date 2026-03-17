/**
 * Export CV to a PDF file.
 * Run: node export-pdf.js
 * Requires: npm install (to get puppeteer).
 *
 * Set PAGE to the HTML file to export; OUTPUT_DIR to where to save the PDF.
 */

const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = parseInt(process.env.CV_PORT, 10) || 37542;
const ROOT = __dirname;

function serveFile(req, res) {
  const urlPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(ROOT, urlPath.split('?')[0].replace(/^\//, ''));
  const ext = path.extname(filePath);
  const types = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon',
  };
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

const PAGE = process.env.CV_PAGE || 'cv-print-clean.html';
const OUTPUT_DIR = process.env.CV_PDF_OUTPUT || path.join(process.env.HOME || require('os').homedir(), 'Downloads');
const OUTPUT_NAME = process.env.CV_PDF_NAME || 'Will-Dundon-CV.pdf';

async function main() {
  const server = http.createServer(serveFile);
  await new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', resolve).on('error', reject);
  });
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}/${PAGE}`;

  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch (e) {
    console.error('Puppeteer not installed. Run: npm install');
    process.exit(1);
  }

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.emulateMediaType('print');
  await page.goto(url, { waitUntil: 'networkidle0' });
  const outPath = path.join(OUTPUT_DIR, OUTPUT_NAME);
  await page.pdf({
    path: outPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '14mm', right: '14mm', bottom: '14mm', left: '14mm' },
  });
  await browser.close();
  server.close();
  console.log('PDF saved:', outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
