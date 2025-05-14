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

  validateAndFormatInputDate(inputDate) {
    const [day, month, year] = inputDate.split('/');
    const input = new Date(`${year}-${month}-${day}T00:00:00`);

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zera a hora para comparar só a data

    console.log(today);
    console.log(input);
    if (input < today) {
      throw new Error(
        "A data para a consulta não pode ser menor que o dia vigente."
      );
    }

    // Formata a data para o padrão do banco se necessário (ex: yyyy-mm-dd)
    const formattedDate = `${year}-${month}-${day}`;
    return { myDate: formattedDate };
  },

  priorates() {
    const filePath = path.join(__dirname, '../users.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  },
  createWaitingLinePassword: async () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let password = '';

    for (let i = 0; i < 2; i++) {
      password += letters.charAt(Math.floor(Math.random() * letters.length));
    }

    for (let i = 0; i < 3; i++) {
      password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }

    try {
      const checkPassword = await UserModel.listAllPassword(password);

      if (checkPassword.length > 0) {
        return await UserRepository.createWaitingLinePassword(); // Recursão
      }

      return password;

    } catch (error) {
      console.error('Erro ao verificar senha:', error.message);
      throw error;
    }

  }
};
module.exports = UserRepository;
