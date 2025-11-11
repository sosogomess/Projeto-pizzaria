import express from "express";
import session from "express-session";
import { Pool } from "pg";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Banco PostgreSQL
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "pizzaria",
  password: "123456",
  port: 7777,
});

// Configurações
app.use(express.urlencoded({ extended: true }));
app.use(
  session({ secret: "pizzaria2025", resave: false, saveUninitialized: false })
);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//Verifica se o usuario esta logado e redirecionado ele para a página correta
function proteger(req, res, next) {
  if (!req.session.usuario) return res.redirect("/");
  next();
}

// Login
app.get("/", (req, res) => res.render("login", { erro: null }));

app.post("/login", async (req, res) => {
  const { email, senha } = req.body;
  const result = await pool.query(
    "SELECT * FROM usuarios WHERE email = $1 AND senha = $2",
    [email, senha]
  );
  if (result.rows.length > 0) {
    req.session.usuario = result.rows[0];
    res.redirect("/dashboard");
  } else {
    res.render("login", { erro: "Email ou senha incorretos!" });
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// Dashboard
app.get("/dashboard", proteger, async (req, res) => {
  try {
    const busca = req.query.busca || "";
    const query = busca
      ? "SELECT * FROM pizzas WHERE nome ILIKE $1 ORDER BY nome"
      : "SELECT * FROM pizzas ORDER BY nome";

    const pizzas = await pool.query(query, busca ? [`%${busca}%`] : []);

    const vendas = await pool.query(`
            SELECT v.id, u.nome AS usuario, l.nome AS pizza, v.quantidade,
                         TO_CHAR(v.data_venda, 'DD/MM HH24:MI') AS data
            FROM venda v
            JOIN usuarios u ON u.id = v.usuario_id
            JOIN pizzas l ON l.id = v.pizza_id
            ORDER BY v.data_venda DESC LIMIT 5
        `);

    res.render("dashboard", {
      usuario: req.session.usuario,
      pizzas: pizzas.rows,
      vendas: vendas.rows,
    });
  } catch (err) {
    console.error("Erro ao carregar dashboard:", err);
    res.status(500).send("Erro interno");
  }
});

// Cadastrar Pizza
app.post("/pizzas", proteger, async (req, res) => {
  const { nome, preco, estoque } = req.body;
  if (!nome || !preco) return res.send("Preencha todos os campos!");
  await pool.query(
    "INSERT INTO pizzas (nome, preco, estoque) VALUES ($1, $2, $3)",
    [nome, preco, estoque]
  );
  res.redirect("/dashboard");
});

// Atualizar Pizza
app.post("/pizzas/update/:id", proteger, async (req, res) => {
  const { id } = req.params;
  const { nome, preco, estoque } = req.body;
  await pool.query(
    "UPDATE pizzas SET nome = $1, preco = $2, estoque = $3 WHERE id = $4",
    [nome, preco, estoque, id]
  );
  res.redirect("/dashboard");
});

// Excluir Pizza
app.post("/pizzas/delete/:id", proteger, async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM pizzas WHERE id = $1", [id]);
  res.redirect("/dashboard");
});

// Registrar Venda
app.post("/vendas", proteger, async (req, res) => {
  const { pizza_id, quantidade } = req.body;
  const usuario_id = req.session.usuario.id;
  await pool.query(
    "INSERT INTO venda (usuario_id, pizza_id, quantidade, data_venda) VALUES ($1, $2, $3, NOW())",
    [usuario_id, pizza_id, quantidade]
  );
  await pool.query("UPDATE pizzas SET estoque = estoque - $1 WHERE id = $2", [
    quantidade,
    pizza_id,
  ]);
  res.redirect("/dashboard");
});

// Inicia o servidor
app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});