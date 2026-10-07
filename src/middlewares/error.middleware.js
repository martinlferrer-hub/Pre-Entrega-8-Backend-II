const statusFromError = (error) => {
  if (error.status) return error.status;
  if (error.name === "ValidationError" || error.name === "CastError") return 400;
  if (error.code === 11000) return 409;
  return 500;
};

export const errorMiddleware = (err, req, res, next) => {
  const status = statusFromError(err);
  const message = status === 500 ? "Error interno del servidor" : (err.message || "Error en la solicitud");

  res.status(status).json({
    status: "error",
    message
  });
};
