import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

// Étendre l'interface Request pour inclure "user"
interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Token manquant" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

    // Récupérer l'utilisateur
    const user = await User.findById(decoded.id).select("_id name email");
    if (!user) {
      return res.status(401).json({ error: "Utilisateur introuvable" });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    };

    return next();
  } catch (err) {
    return res.status(401).json({ error: "Token invalide" });
  }
};