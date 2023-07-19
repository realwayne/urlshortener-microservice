require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require("dns");
const { v4: uuid } = require("uuid");

const app = express();
const urls = new Map();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  try {
    const { protocol, host } = new URL(originalUrl);

    if (protocol !== 'http:' && protocol !== 'https:') {
      throw new Error('Invalid URL');
    }

    dns.lookup(host, (err) => {
      if (err) {
        res.json({ error: 'Invalid URL' });
      } else {

        const existingUrl = Array.from(urls.values()).find(
          (url) => url.original_url === originalUrl
        );
        if (existingUrl) {
          res.json({
            original_url: existingUrl.original_url,
            short_url: existingUrl.short_url,
          });
        } else {
          const shortUrl = uuid();

          urls.set(shortUrl, {
            original_url: originalUrl,
            short_url: shortUrl,
          });

          res.json({
            original_url: originalUrl,
            short_url: shortUrl,
          });
        }
      }
    });
  } catch (error) {
    res.json({ error: 'Invalid URL' });
  }
});

app.get('/api/shorturl/:shortUrl', (req, res) => {
  const shortUrl = req.params.shortUrl;

  const url = urls.get(shortUrl);
  if (url) {
    res.redirect(url.original_url);
  } else {
    res.sendStatus(404);
  }
});


const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
