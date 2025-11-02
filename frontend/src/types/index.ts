export type RequestType = 'salary_negotiation' | 'promotion' | 'benefits_adjustment' | 'harassment_complaint' | 'workload_concern' | 'training_request' | 'internal_mobility' | 'general_inquiry';
export type RequestStatus = 'draft' | 'submitted' | 'under_review' | 'resolved' | 'rejected';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Request {
  _id: string;
  requestType: RequestType;
  status: RequestStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  conversationData: {
    messages: Message[];
    summary: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'employee' | 'hr' | 'admin';
  position?: string;
  department?: string;
}
