const db = require("./database");
const { promisify } = require("util");

// Função run personalizada que retorna lastID
const runAsync = function(sql, params) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

const getAsync = promisify(db.get.bind(db));
const allAsync = promisify(db.all.bind(db));
const execAsync = promisify(db.exec.bind(db));

module.exports = {
  runAsync,
  getAsync,
  allAsync,
  execAsync,
};