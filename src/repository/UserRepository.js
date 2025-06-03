const fs = require('fs');
const path = require('path');
const UserModel = require('../models/UserModel');

const UserRepository = {
  // Regras para validar a senha
  validatePassword: (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return passwordRegex.test(password);
  },
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validateAndFormatBirthDate: (birthDate, callback) => {
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = birthDate ? birthDate.match(dateRegex) : null;

    if (!match) {
      return {
        error: "Data de nascimento inválida. Use o formato DD/MM/YYYY.",
      };
    }

    const [, day, month, year] = match; // O primeiro índice é a string inteira
    const formattedDate = `${year}-${month}-${day}`; // Convertendo para YYYY-MM-DD
    const birth = new Date(formattedDate);
    const today = new Date();
    const minDate = new Date("1900-01-01");

    if (birth > today) {
      return { error: "Data de nascimento não pode ser no futuro." };
    }

    if (birth < minDate) {
      return {
        error: "Data de nascimento inválida. Ano deve ser maior que 1900.",
      };
    }

    return { formattedDate };
  },

  validateAndFormatInputDate(inputDateTime) {

    const [datePart, timePart] = inputDateTime.split(" ");

    if (!datePart || !timePart) {
      throw new Error("Formato inválido. Use: DD/MM/YYYY HH:MM");
    }

    const [day, month, year] = datePart.split("/").map(Number);
    const [hours, minutes] = timePart.split(":").map(Number);

    if (
      isNaN(day) || isNaN(month) || isNaN(year) ||
      isNaN(hours) || isNaN(minutes)
    ) {
      throw new Error("Data ou hora inválida.");
    }

    // Cria a data no fuso horario local local
    const inputDate = new Date(year, month - 1, day, hours, minutes);

    if (isNaN(inputDate.getTime())) {
      throw new Error("Data ou hora inválida.");
    }

    const now = new Date();

    if (inputDate <= now) {
      throw new Error("A data/hora deve ser futura.");
    }

    const formattedDate = `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    const fullDateTime = `${formattedDate} ${formattedTime}`;

    return { myDate: fullDateTime };
    
  },

  priorates() {
    const filePath = path.join(__dirname, "../users.json");
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  },

  createWaitingLinePassword: async () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    let password = "";

    for (let i = 0; i < 2; i++) {
      password += letters.charAt(Math.floor(Math.random() * letters.length));
    }

    for (let i = 0; i < 3; i++) {
      password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }

    try {
      const checkPassword = await UserModel.listAllPassword(password); // faz um select de todas as senhas no banco e compara para ver se ja foi gerada essa senha é unique

      if (checkPassword.length > 0) {
        return await UserRepository.createWaitingLinePassword(); // Recursão
      }

      return password;
    } catch (error) {
      console.error("Erro ao verificar senha:", error.message);
      throw error;
    }
  },

  validateCpf: async (cpf) => {
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
      return false;
    }

    let soma = 0;
    let resto;

    for (let i = 1; i <= 9; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }

    resto = (soma * 10) % 11;

    if (resto === 10 || resto === 11) {
      resto = 0;
    }

    if (resto !== parseInt(cpf.substring(9, 10))) {
      return false;
    }

    soma = 0;
    for (let i = 1; i <= 10; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }

    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) {
      resto = 0;
    }

    if (resto !== parseInt(cpf.substring(10, 11))) {
      return false;
    }

    return true;
  },
};
module.exports = UserRepository;
