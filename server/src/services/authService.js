const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const { userModel } = require("../models/userModel");

const SALT_ROUNDS = 12;

function generateToken(id, role) {
  return jwt.sign({ id, role }, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
}

const authService = {
  async register(data) {
    const existing = await userModel.findByEmail(data.email);
    if (existing) {
      throw new Error("Email already registered");
    }

    const password_hash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const user = await userModel.create({
      email: data.email,
      password_hash,
      first_name: data.first_name,
      last_name: data.last_name,
      role: data.role || "student",
    });

    const token = generateToken(user.id, user.role);
    return { token, user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role } };
  },

  async login(email, password) {
    const user = await userModel.findByEmail(email);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new Error("Invalid credentials");
    }

    const token = generateToken(user.id, user.role);
    return { token, user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role } };
  },
};

module.exports = { authService };
