const fsPromises = require('fs').promises;
const path = require('path');
const { Command } = require('commander');
const http = require('http');

const program = new Command();

// Оголошуємо опції командного рядка
program
    .requiredOption('-h, --host <host>', 'server host')
    .requiredOption('-p, --port <port>', 'server port')
    .requiredOption('-c, --cache <cache>', 'cache directory');

program.parse(process.argv);
const options = program.opts();  // Правильне отримання аргументів з командного рядка

const cacheDir = options.cache;

// Створюємо сервер
const server = http.createServer(async (req, res) => {
    const code = req.url.substring(1);
    const filePath = path.join(cacheDir, `${code}.jpg`);

    if (req.method === 'GET') {
        try {
            const data = await fsPromises.readFile(filePath);
            res.writeHead(200, { 'Content-Type': 'image/jpeg' });
            res.end(data);
        } catch (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Image not found');
        }
    } else if (req.method === 'PUT') {
        let body = [];
        req.on('data', chunk => body.push(chunk));
        req.on('end', async () => {
            try {
                await fsPromises.writeFile(filePath, Buffer.concat(body));
                res.writeHead(201, { 'Content-Type': 'text/plain' });
                res.end('Image saved');
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            }
        });
    } else if (req.method === 'DELETE') {
        try {
            await fsPromises.unlink(filePath);
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Image deleted');
        } catch (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Image not found');
        }
    } else {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method Not Allowed');
    }
});

server.listen(options.port, options.host, () => {
    console.log(`Server running at http://${options.host}:${options.port}/`);
});
