
## **📌 Requisitos Funcionais (RF)**  
### **1️⃣ Autenticação e Autorização**  
✅ RF-01: Permitir que usuários façam login com e-mail e senha.  
✅ RF-02: Gerar e validar tokens JWT para autenticação de usuários.  
✅ RF-03: Permitir logout invalidando o token JWT.  
✅ RF-04: Impedir acessos não autorizados a rotas protegidas.  
✅ RF-05: Renovar tokens JWT expirados sem precisar de novo login.  

### **2️⃣ Cadastro e Gestão de Usuários**  
✅ RF-06: Permitir que novos usuários se registrem.  
✅ RF-07: Validar dados do usuário antes do cadastro (e-mail, senha, nome).  
✅ RF-08: Criar diferentes níveis de permissão para usuários (exemplo: Admin, Usuário Comum).  
✅ RF-09: Permitir que usuários atualizem seus dados.  
✅ RF-10: Permitir que usuários alterem sua senha.  
✅ RF-11: Implementar recuperação de senha via e-mail.  
✅ RF-12: Listar todos os usuários (somente para admins).  
✅ RF-13: Exibir detalhes do perfil de um usuário autenticado.  
✅ RF-14: Excluir conta de usuário.  

### **3️⃣ Segurança**  
✅ RF-15: Aplicar middleware de autenticação nas rotas protegidas.  
✅ RF-16: Implementar CORS para permitir acesso seguro à API.  
✅ RF-17: Aplicar sanitização e validação de entrada de dados para evitar injeção de SQL e XSS.  
✅ RF-18: Registrar logs de autenticação e eventos críticos.  

### **4️⃣ Testes de Integridade e Monitoramento**  
✅ RF-19: Implementar rota de teste para verificar se a API está online.  
✅ RF-20: Criar testes unitários para serviços e controladores.  
✅ RF-21: Criar testes de integração para verificar o fluxo completo do sistema.  

---

## **📌 Requisitos Não Funcionais (RNF)**  
### **1️⃣ Arquitetura e Performance**  
✅ RNF-01: O projeto deve seguir a arquitetura MVC (Model-View-Controller).  
✅ RNF-02: A API deve ser construída utilizando o framework **Express.js**.  
✅ RNF-03: O acesso ao banco de dados deve ser feito via DAO (Data Access Object).  
✅ RNF-04: Todas as chamadas assíncronas ao banco de dados devem usar **Promisify** para evitar callbacks.   
✅ RNF-05: O banco de dados utilizado deve ser o **SQLite**.   
✅ RNF-06: O projeto não deve utilizar nenhum ORM. 

### **2️⃣ Segurança e Boas Práticas**  
✅ RNF-07: Senhas devem ser armazenadas de forma segura usando hashing (ex: bcrypt).  
✅ RNF-08: Tokens JWT devem expirar após um período definido e devem ser renováveis.  
✅ RNF-09: O sistema deve seguir boas práticas de desenvolvimento seguro para APIs REST.  
✅ RNF-10: Configurações sensíveis (chaves JWT, credenciais de banco de dados) devem ser armazenadas em variáveis de ambiente (`.env`).  

### **3️⃣ Testes e Manutenção**  
✅ RNF-11: Deve haver testes automatizados para garantir a integridade do sistema.  
✅ RNF-12: O código deve ser modular e reutilizável, facilitando a manutenção.  
✅ RNF-13: Logs de erros devem ser armazenados para facilitar a depuração.  

---

## **📌 Regras de Negócio (RN)**  
### **1️⃣ Regras de Cadastro e Autenticação**  
⚖️ RN-01: Apenas usuários com e-mail válido podem se registrar.  
⚖️ RN-02: A senha deve conter pelo menos:
   - 8 caracteres  
   - 1 letra maiúscula  
   - 1 letra minúscula  
   - 1 número  
   - 1 caractere especial  

⚖️ RN-03: Um usuário não pode se registrar com um e-mail já existente.  

### **2️⃣ Regras de Autorização**  
⚖️ RN-05: Apenas administradores podem listar todos os usuários.  
⚖️ RN-06: Apenas o próprio usuário pode editar seu perfil, exceto admins.  
⚖️ RN-07: Apenas administradores podem excluir contas de outros usuários.  

### **3️⃣ Segurança**  
⚖️ RN-08: Tokens JWT devem ser obrigatórios para acessar rotas protegidas.  
⚖️ RN-09: Senhas não podem ser recuperadas, apenas redefinidas via e-mail.  

---

