export type RequestType = 
  | 'salary_negotiation' 
  | 'promotion' 
  | 'benefits_adjustment' 
  | 'harassment_complaint' 
  | 'workload_concern' 
  | 'training_request' 
  | 'internal_mobility' 
  | 'general_inquiry'
  | 'salary'  // Alias pour compatibilité
  | 'complaint' // Alias pour compatibilité
  | 'other'; // Alias pour compatibilité

export type RequestStatus = 'draft' | 'submitted' | 'under_review' | 'resolved' | 'rejected';

export interface Message {
  role: 'user' | 'assistant' | 'employee' | 'ai' | 'hr';
  content: string;
  timestamp: Date;
}

export interface IRequest {
  _id?: string;
  employeeId?: {
    _id?: string;
    email?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    department?: string;
    position?: string;
  };
  type?: string;
  requestType?: RequestType;
  title?: string;
  description?: string;
  status: RequestStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  conversationData?: {
    messages: Message[];
    collectedData?: Record<string, any>;
    summary?: string;
  };
  structuredData?: Record<string, any>;
  hrNotes?: string;
  reviewedBy?: string;
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
  isAnonymous?: boolean;
  consentGiven?: boolean;
  pdfReportUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role: 'employee' | 'hr' | 'admin';
  position?: string;
  department?: string;
  hireDate?: Date;
  isActive?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface DashboardStats {
  total: number;
  pending: number;
  resolved: number;
  urgent: number;
}

// Type guards
export function isValidRequestType(type: string): type is RequestType {
  const validTypes: RequestType[] = [
    'salary_negotiation', 'promotion', 'benefits_adjustment',
    'harassment_complaint', 'workload_concern', 'training_request',
    'internal_mobility', 'general_inquiry', 'salary', 'complaint', 'other'
  ];
  return validTypes.includes(type as RequestType);
}

// Conversion des types
export function normalizeRequestType(type: string): RequestType {
  const typeMap: Record<string, RequestType> = {
    'salary': 'salary_negotiation',
    'complaint': 'harassment_complaint',
    'other': 'general_inquiry'
  };
  return (typeMap[type] || type) as RequestType;
}