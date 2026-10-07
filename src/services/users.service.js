import { usersRepository } from "../repositories/users.repository.js";
import { toUserDTO } from "../dto/user.dto.js";

export const usersService = {
  async getAllUsers() {
    const users = await usersRepository.findAllUsers();
    return users.map(toUserDTO);
  }
};
