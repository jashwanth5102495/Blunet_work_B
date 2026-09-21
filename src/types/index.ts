export type Role = 'EMPLOYEE' | 'MARKETING_HEAD' | 'ADMIN' | 'FOUNDER';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';

export type LeadStatus =
  | 'LOCKED'
  | 'AVAILABLE'
  | 'CALLING'
  | 'RESPONSE_PENDING'
  | 'COMPLETED'
  | 'INTERESTED'
  | 'NOT_INTERESTED'
  | 'FOLLOW_UP'
  | 'WRONG_NUMBER'
  | 'NO_ANSWER'
  | 'CLOSED';

export type ResourceVisibility = 'ALL' | 'EMPLOYEE' | 'MARKETING_HEAD' | 'ADMIN' | 'FOUNDER';

export interface AuthPayload {
  userId: string;
  employeeId: string;
  role: Role;
  name: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}
