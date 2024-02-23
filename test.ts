import Meiyo from "./index";
const app = new Meiyo({ port: 8000 });

app.use("*", (req, res, next) => {
  console.log(req.path);

  return "Hello World";
});

app.listen().then((meiyo) => {
  console.log(`Listening on port: ${meiyo.port}`);
});
