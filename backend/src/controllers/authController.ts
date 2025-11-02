import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function register(req: Request, res: Response) {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name)
      return res.status(400).json({ error: "Missing fields" });

    // ✅ empêcher de s'enregistrer admin par défaut
    const allowedRoles = ["employee", "hr"];
    const finalRole = allowedRoles.includes(role) ? role : "employee";

    // ✅ Vérifier si user existe déjà
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashed,
      name,
      role: finalRole,
    });

    await user.save();

    return res.json({
      ok: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (!user.password) return res.status(403).json({ error: "No local login" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "8h" }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}