CREATE DATABASE pizzaria
\c pizzaria

CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(50) NOT NULL,
    tipo VARCHAR(20) DEFAULT 'comum'
);

CREATE TABLE pizza (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100),
    preco DECIMAL(5,2),
    estoque INTEGER
);

CREATE TABLE vendas (
    id SERIAL PRIMARY KEY,
   usuario_id INTEGER REFERENCES usuario(id),
    pizza_id INTEGER REFERENCES pizza(id),
    quantidade INTEGER,
    data_venda TIMESTAMP 
)

INSERT INTO usuarios (nome, email, senha, tipo) VALUES
('Administrador pizzaria', 'admin@pizzaria.com', '123', 'admin'),
('Funcionário Zé', 'funcionário@pizzaria.com', '123', 'comum'):

INSERT INTO pizzas (nome, preco, estoque) VALUES
('Margherita', 25.00, 50),
('Pepperoni', 30.00, 40),
('Quatro Queijos', 35.00, 30),
('Calabresa', 28.00, 20);

INSERT INTO vendas (usuarios_id, pizza_id, quantidade) VALUES
(2,1,2),
(2,3,1);

UPDATE pizzas 
SET estoque = estoque - (
    SELECT COALESCE(SUM(quantidade), 0) 
    FROM vendas 
    WHERE vendas.pizza_id = pizzas.id
)