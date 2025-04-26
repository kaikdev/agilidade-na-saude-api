const request = require("supertest");
const http = require("http");
const app = require("../src/server");
const db = require("../src/config/database");

  let server;

describe("Testes de Gestão de Usuários", () => {
  let token;
  let userId;

  beforeAll((done) => {
    server = http.createServer(app);
    server.listen(done);
  });

  beforeAll(async () => {
    // Criar um usuário e capturar o ID 
    const res = await request(app).post("/api/users").send({
      name: "Usuário Teste",
      email: "usuario@email.com",
      password: "Senha@123",
      role: "admin",
    });

    // Garantir que o ID do usuário foi retornado
    userId = res.body.userId;
    if (!userId)
      throw new Error("userId não foi retornado na criação do usuário");

    // Fazer login e capturar o token
    const loginRes = await request(app).post("/api/login").send({
      email: "usuario@email.com",
      password: "Senha@123",
    });

    token = loginRes.body.token;
    if (!token) throw new Error("Token não foi retornado no login");
  });

  test("Deve atualizar os dados do usuário", async () => {
    const res = await request(app)
      .put(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Usuário Atualizado",
        email: "usuario@email.com",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Usuário atualizado com sucesso."
    );
  });

  test("Deve excluir a conta do usuário", async () => {
    const res = await request(app)
      .delete(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Usuário excluído com sucesso.");
  });

  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
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
});
