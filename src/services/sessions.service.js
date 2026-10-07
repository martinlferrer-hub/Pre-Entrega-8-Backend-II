import { usersRepository } from "../repositories/users.repository.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { toAuthenticatedUserDTO, toUserDTO } from "../dto/user.dto.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

const createError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

export const sessionsService = {
  async register(data = {}) {
    const { first_name, last_name, email, password } = data;

    if (!first_name || !last_name || !email || !password) {
      throw createError("Faltan campos obligatorios", 400);
    }

    if (![first_name, last_name, email, password].every((value) => typeof value === "string")) {
      throw createError("Los campos enviados no tienen un formato válido", 400);
    }

    const normalizedFirstName = first_name.trim();
    const normalizedLastName = last_name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedFirstName || !normalizedLastName) {
      throw createError("Faltan campos obligatorios", 400);
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      throw createError("El email no tiene un formato válido", 400);
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      throw createError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`, 400);
    }

    if (await usersRepository.findByEmail(normalizedEmail)) {
      throw createError("El email ya está registrado", 409);
    }

    try {
      const user = await usersRepository.createUser({
        first_name: normalizedFirstName,
        last_name: normalizedLastName,
        email: normalizedEmail,
        password: await hashPassword(password),
        role: "user"
      });

      return toUserDTO(user);
    } catch (error) {
      if (error.code === 11000) throw createError("El email ya está registrado", 409);
      throw error;
    }
  },

  async login(email, password) {
    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      throw createError("Credenciales inválidas", 401);
    }

    const user = await usersRepository.findByEmail(email.trim().toLowerCase());
    if (!user || !(await comparePassword(password, user.password))) {
      throw createError("Credenciales inválidas", 401);
    }

    return toAuthenticatedUserDTO(user);
  },

  current(user) {
    return toAuthenticatedUserDTO(user);
  },

  async getSessions() {
    return [];
  }
};
