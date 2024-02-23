# Meiyo - HTTP Web Server with Socket Support

Meiyo is a **work in progress** library to make HTTP Web Server with Socket Support. It is built on top of the ws and node:http module.

## Use

<code>npm install meiyo</code>

## Hello World

```js
const { default: Meiyo } = require("meiyo");

const app = new Meiyo({ port: 8000 });

app.get("/", (req, res) => {
  res.html();
  return "<h1>Hello World</h1>";
});

app.listen();
```

## To-do

- Cookies Support

## FAQ

**Is there middlewares and does it support express middlewares ?**
Meiyo is built on the http module not, express. There are middlewares, but unfortunately express middlewares are not supported, due to the lack of the next() function.

## Changelogs

**1.0.1** -- Fixed the .use() method, response and request are shared with the similar routes. + You can get the types of Meiyo namespace and others.
**1.0.0-readme** -- updated the readme
**1.0.0-index** -- forgot to make the index file
**1.0.0-types** -- fixed types
**1.0.0** -- First version (unfinished)
