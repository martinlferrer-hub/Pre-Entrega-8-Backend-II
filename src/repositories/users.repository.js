import { usersDao } from "../dao/users.dao.js";

export const usersRepository = {
  findByEmail(email) {
    return usersDao.findByEmail(email);
  },

  createUser(userData) {
    return usersDao.create(userData);
  },

  findAllUsers() {
    return usersDao.findAllSafe();
  }
};
