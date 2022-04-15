const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = 8888;

const clientTemplate = fs.readFileSync(
  path.resolve(__dirname, 'index.html'), 
  'utf8', 
  (err) => { if (err) throw new Error('file not readed') }
)

let clients = [];

const server = new http.Server();
server.listen(PORT, () => console.log('server started'));

server.on('request', (req, res) => {
  const pathname = req.url;

  if (pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' }).end(clientTemplate)
  } 
  else if (pathname !== '/chat' || req.method !== 'GET' && req.method !== 'POST') {
    res.writeHead(404).end()
  }
  else if (req.method === 'GET') {
    acceptNewClient(req, res);
  }
  else {
    broadcastNewMessage(req, res);
  }
})

const acceptNewClient = (req, res) => {
  clients.push(res);

  req.on('end', () => {
    clients.splice(clients.indexOf(response), 1);
    res.end();
  })

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
  })

  res.write('event: chat\ndata: Connected\n\n')
}

const broadcastNewMessage = async (req, res) => {
  req.setEncoding('utf8');
  
  let body = '';

  for await (const chunk of req) body += chunk;
  
  res.writeHead(200).end();
  
  let msg = `data: ${ body.replace("\n", "\ndata: ") }`;
  let event = `event: chat\n${ msg }\n\n`;

  clients.forEach(client => client.write(event));
}