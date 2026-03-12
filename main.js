const http = require('http');
const fs = require('fs').promises;
const { Command } = require('commander');
const { XMLBuilder } = require('fast-xml-parser');
const url = require('url');
const program = new Command();
program
  .requiredOption('-i, --input <path>', 'шлях до файлу JSON')
  .requiredOption('-h, --host <address>', 'адреса сервера')
  .requiredOption('-p, --port <number>', 'порт сервера')
  .parse(process.argv);

const options = program.opts();

function filterIrisData(data, query) {
  let filtered = data;
  if (query.min_petal_length) {
    const minLen = parseFloat(query.min_petal_length);
    filtered = filtered.filter(item => item['petal.length'] > minLen);
  }
  return filtered.map(item => {
    const flowerNode = {
      'sepal.length': item['sepal.length'],
      'sepal.width': item['sepal.width'],
      'petal.length': item['petal.length'],
      'petal.width': item['petal.width']
    };

    if (query.variety === 'true') {
      flowerNode.variety = item.variety;
    }

    return flowerNode;
  });
}

const server = http.createServer(async (req, res) => {
  try {
    try {
      await fs.access(options.input);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Cannot find input file');
    }
    const rawData = await fs.readFile(options.input, 'utf8');
    const jsonData = JSON.parse(rawData);
    const parsedUrl = url.parse(req.url, true);
    const processedItems = filterIrisData(jsonData, parsedUrl.query);
    const builder = new XMLBuilder({
      format: true,
      ignoreAttributes: true,
      arrayNodeName: "flower" 
    });
    const xmlContent = builder.build({ 
      irises: {
        flower: processedItems 
      }
    });

    res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
    res.end(xmlContent);

  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Server Error: ' + err.message);
  }
});





server.listen(options.port, options.host, () => {
  console.log(`Сервер працює на http://${options.host}:${options.port}`);
});