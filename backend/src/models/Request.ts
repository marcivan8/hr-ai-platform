import mongoose, { Schema, Document } from 'mongoose';

export type RequestType =
  | 'salary_negotiation'
  | 'promotion'
  | 'benefits_adjustment'
  | 'harassment_complaint'
  | 'workload_concern'
  | 'training_request'
  | 'internal_mobility'
  | 'general_inquiry';

export type RequestStatus = 'draft' | 'submitted' | 'under_review' | 'resolved' | 'rejected';

export interface IRequest extends Document {
  employeeId: mongoose.Types.ObjectId;
  type?: string;
  requestType?: RequestType;
  title?: string;
  description?: string;
  status: RequestStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  conversationData?: {
    messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
    collectedData: Record<string, any>;
    summary: string;
  };
  structuredData?: Record<string, any>;
  hrNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  resolution?: {
    decision: string;
    feedback: string;
    actionTaken: string;
    resolvedAt: Date;
  };
  aiRecommendations?: {
    suggestedActions: string[];
    riskLevel: 'low' | 'medium' | 'high';
    urgencyScore: number;
    similarCases?: number;
  };
  aiSummary?: string;
  aiScenarios?: Array<{ description: string; [key: string]: any }>;
  isAnonymous: boolean;
  consentGiven?: boolean;
  pdfReportUrl?: string;
}

const RequestSchema = new Schema<IRequest>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String },
    requestType: {
      type: String,
      enum: [
        'salary_negotiation',
        'promotion',
        'benefits_adjustment',
        'harassment_complaint',
        'workload_concern',
        'training_request',
        'internal_mobility',
        'general_inquiry',
      ],
    },
    title: { type: String },
    description: { type: String },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'under_review', 'resolved', 'rejected'],
      default: 'draft',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    conversationData: {
      messages: [
        {
          role: { type: String, enum: ['user', 'assistant'] },
          content: String,
          timestamp: { type: Date, default: Date.now },
        },
      ],
      collectedData: Schema.Types.Mixed,
      summary: String,
    },
    structuredData: Schema.Types.Mixed,
    hrNotes: String,
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    resolution: {
      decision: String,
      feedback: String,
      actionTaken: String,
      resolvedAt: Date,
    },
    aiRecommendations: {
      suggestedActions: [String],
      riskLevel: { type: String, enum: ['low', 'medium', 'high'] },
      urgencyScore: Number,
      similarCases: Number,
    },
    aiSummary: String,
    aiScenarios: [Schema.Types.Mixed],
    isAnonymous: { type: Boolean, default: false },
    consentGiven: { type: Boolean, default: true },
    pdfReportUrl: String,
  },
  { timestamps: true }
);

RequestSchema.index({ employeeId: 1, createdAt: -1 });
RequestSchema.index({ status: 1, priority: -1 });
RequestSchema.index({ requestType: 1 });

// ✅ Export both the interface and the model correctly
const RequestModel = mongoose.model<IRequest>('Request', RequestSchema);
export default RequestModel;