var express = require("express");
var mysql = require("mysql");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var jwt = require("jsonwebtoken");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

const authMiddleware = (req, res, next) => {
  const { authorization } = req.headers;
  try {
    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, "secret");
    req.loggedUser = decoded;
    next();
  } catch {
    throw new DomainException("Invalid token", 401);
  }
};

var con = mysql.createConnection({
  host: "localhost",
  user: "pingo-recicla",
  password: "12345",
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});
var app = express();
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.post("/registration", (req, res) => {
  const nome = req.body.nome;
  const cpf = req.body.cpf;
  const email = req.body.email;
  const senha = req.body.senha;

  var sql = `INSERT INTO PingoRecicla.Users (nome, senha , cpf , email) VALUES ('${nome}','${senha}','${cpf}','${email}')`;
  con.query(sql, (err, result) => {
    if (err) res.status(400).json({ mensage: "Unable to create user" });
    else res.status(201).json({ mensage: "User created successfully" });
  });
});
app.post("/login", (req, res) => {
  const { email, senha } = req.body;
  var sql = `
    SELECT * FROM PingoRecicla.Users u 
    WHERE u.email = '${email}'
    and u.senha = '${senha}'
    limit 1
  `;
  con.query(sql, (err, result) => {
    if (err)
      res.status(400).json({
        mensage: "Não foi possível efetuar login. Tente novamente mais tarde.",
      });
    if (result.length === 1) {
      var { nome, cpf, email, id } = result[0];
      var token = jwt.sign({ nome, cpf, email, id }, "secret", {
        expiresIn: "6h",
      });
      res.status(200).json({ token });
    } else {
      res.status(401).json({ mensage: "Falha na autenticação" });
    }
  });
});

module.exports = app;
