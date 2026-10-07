import { UserModel } from "../models/User.js";

export const usersDao = {
  findByEmail(email) {
    return UserModel.findOne({ email }).select("+password");
  },

  create(userData) {
    return UserModel.create(userData);
  },

  findAllSafe() {
    return UserModel.find()
      .select("first_name last_name email role createdAt updatedAt")
      .lean();
  }
};
