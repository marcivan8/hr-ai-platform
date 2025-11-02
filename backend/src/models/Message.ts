import { Schema, model, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  requestId: Types.ObjectId;
  sender: 'employee' | 'ai' | 'hr';
  text: string;
  meta?: any;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>({
  requestId: { type: Schema.Types.ObjectId, ref: 'Request', required: true },
  sender: { type: String, enum: ['employee','ai','hr'], required: true },
  text: { type: String, required: true },
  meta: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const Message = model<IMessage>('Message', messageSchema);