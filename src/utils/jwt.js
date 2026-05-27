import jwt from 'jsonwebtoken';

const SECRET = () => process.env.JWT_SECRET || 'domus_secret_dev';

export const signToken = (payload, expiresIn = '24h') =>
  jwt.sign(payload, SECRET(), { expiresIn });

export const verifyToken = (token) =>
  jwt.verify(token, SECRET());

export const decodeToken = (token) =>
  jwt.decode(token);
