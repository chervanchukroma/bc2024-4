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
const superagent = require('superagent');

const server = http.createServer(async (req, res) => {
    const code = req.url.substring(1);
    const filePath = path.join(cacheDir, `${code}.jpg`);

    if (req.method === 'GET') {
        try {
            const data = await fsPromises.readFile(filePath);
            res.writeHead(200, { 'Content-Type': 'image/jpeg' });
            res.end(data);
        } catch (err) {
            // Запит до http.cat якщо файл не знайдено
            try {
                const response = await superagent.get(`https://http.cat/${code}`);
                await fsPromises.writeFile(filePath, response.body);
                res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                res.end(response.body);
            } catch (error) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Image not found on http.cat');
            }
        }
    }
    // Інші методи PUT, DELETE залишаються без змін
});

server.listen(options.port, options.host, () => {
    console.log(`Server running at http://${options.host}:${options.port}/`);
});