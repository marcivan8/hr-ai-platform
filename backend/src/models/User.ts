import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  name: string; // Virtual field
  role: 'employee' | 'hr' | 'admin';
  department?: string;
  position?: string;
  hireDate?: Date;
  salary?: number;
  isActive: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  role: { type: String, enum: ['employee', 'hr', 'admin'], default: 'employee' },
  department: String,
  position: String,
  hireDate: Date,
  salary: { type: Number, select: false },
  isActive: { type: Boolean, default: true }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual pour le nom complet
UserSchema.virtual('name').get(function(this: IUser) {
  return `${this.firstName} ${this.lastName}`.trim();
});

export default mongoose.model<IUser>('User', UserSchema);