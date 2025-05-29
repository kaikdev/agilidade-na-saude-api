// socket.js
module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("📡 Cliente conectado:", socket.id);

    // Adicione handlers para eventos personalizados (se necessário)
    socket.on("finalizeScheduledAppointments", (data) => {
      // Reenvie para todos os clientes
      io.emit("finalizeScheduledAppointments", data);
    });

    socket.on("disconnect", () => {
      console.log("Cliente desconectado:", socket.id);
    });
  });
};