import jwt from 'jsonwebtoken';
const {sign,verify}=jwt;

const protect = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Añadimos la información del usuario al objeto `req`
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export default protect;
