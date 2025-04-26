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
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = inputDate?.match(regex);

    if (!match) {
      throw new Error("Data inválida. Use o formato DD/MM/YYYY.");
    }

    const [, day, month, year] = match;
    const formattedDate = `${year}-${month}-${day}`;
    const serviceDateStr = `${year}${month}${day}`;

    // Data atual em YYYYMMDD para comparação
    const today = new Date();
    const todayStr = `${today.getFullYear()}${String(
      today.getMonth() + 1
    ).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;

    if (serviceDateStr < todayStr) {
      throw new Error(
        "A data para a consulta não pode ser menor que o dia vigente."
      );
    }
    return { formattedDate: `${day}/${month}/${year}` };
  },
};
module.exports = UserRepository;
