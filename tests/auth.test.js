const request = require("supertest");
const http = require("http");
const app = require("../src/server");
const db = require("../src/config/database");

let server;
let userId; // Variável para armazenar o ID do usuário
let token; // Variável para armazenar o token JWT

beforeAll((done) => {
  server = http.createServer(app);
  server.listen(done);
});

describe("Testes de Autenticação", () => {

  test("Deve registrar um novo usuário", async () => {
    const res = await request(app).post("/api/users").send({
      name: "Teste",
      email: "teste@email.com",
      password: "Senha@123",
      role: "admin",
    });

    console.log(res.body); // Mostra a resposta da API
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("userId");

    userId = res.body.userId; // Armazena o ID do usuário gerado
  });

  test("Deve logar um usuário", async () => {
    const res = await request(app).post("/api/login").send(
      {
        email: "teste@email.com",
        password: "Senha@123",
      },
      10000
    );

    console.log(res.body); // Mostra a resposta da API
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");

    token = res.body.token; // Armazena o token gerado
  });

  test("Deve acessar uma rota protegida", async () => {
    const res = await request(app)
      .get(`/api/users/${userId}`) // Usa o ID armazenado
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id");
  });
});

afterAll((done) => {
  server.close(done);
});

afterAll(async () => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error("Erro ao fechar banco:", err.message);
        reject(err);
      } else {
        console.log("Banco fechado.");
        resolve();
      }
    });
  });
});