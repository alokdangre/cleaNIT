import { User } from '../models/userModel.js';

export const findByUsername = (username) => User.findOne({ username });

export const createUser = (user) => User.create(user);
