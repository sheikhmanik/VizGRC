
export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';
export type RiskStatus = 'Draft' | 'Pending Review' | 'Active' | 'Mitigated' | 'Accepted' | 'Expired' | 'Retired' | 'Closed';
export type TreatmentOption = 'Mitigate' | 'Transfer' | 'Accept' | 'Avoid';
export type ControlEffectiveness = 'Effective' | 'Partially Effective' | 'Ineffective' | 'Not Assessed';
export type Location = 'Global' | 'NAM' | 'EMEA' | 'APAC' | 'LATAM';
export type RiskTrend = 'Improving' | 'Stable' | 'Worsening';

export type FieldType = 'text' | 'textarea' | 'select' | 'level';

export interface ControlFieldDefinition {
  id: string;
  label: string;
  type: FieldType;
  options?: string[]; // For 'select' type
  placeholder?: string;
  required?: boolean;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  name: string;
  action: string;
  details: string;
}

export type PlatformRole = 'Administrator' | 'Risk Manager' | 'Compliance Analyst' | 'Auditor' | 'Viewer';

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  role: PlatformRole;
  status: 'Active' | 'Inactive' | 'Pending';
  lastLogin?: string;
}

export interface RiskTreatmentPlan {
  option: TreatmentOption;
  actionPlan: string;
  owner: string;
  targetDate: string;
  priority: 'P1' | 'P2' | 'P3';
  acceptanceType?: 'Temporary' | 'Permanent';
  acceptanceExpiry?: string;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  category: 'Strategic' | 'Operational' | 'Cyber' | 'Compliance' | 'Financial' | 'Privacy';
  subcategory: string;
  status: RiskStatus;
  trend: RiskTrend;
  controlEffectiveness: ControlEffectiveness;

  // Ownership & Governance
  businessUnit: string;
  department: string;
  location: Location;
  owner: string;
  technicalOwner?: string;

  // Mapping
  linkedAssets: string[];
  linkedControls: string[];
  linkedRequirements: string[];
  customAssets: string[];
  customControls: string[];

  // Assessment
  inherentLikelihood: number;
  inherentImpact: number;
  inherentScore: number;
  residualLikelihood: number;
  residualImpact: number;
  residualScore: number;
  appetiteThreshold: number;

  // Treatment
  treatment: RiskTreatmentPlan;

  // Monitoring
  reviewFrequency: 'Quarterly' | 'Semi-Annual' | 'Annual';
  lastReviewDate: string;
  nextReviewDate: string;
  createdAt: string;
  history: AuditEntry[];
}

export interface Framework {
  id: string;
  name: string;
  version: string;
  totalControls: number;
  description: string;
  isCustom?: boolean;
  controlSchema?: ControlFieldDefinition[];
}

export interface Assessment {
  id: string;
  frameworkId: string;
  name: string;
  description?: string;
  project?: string;
  version?: string;
  status: 'In Progress' | 'Completed' | 'Overdue';
  author?: string;
  reviewer?: string;
  startTime?: string;
  endDate?: string;
  progress: number;
  lastUpdated: string;
}

export interface RiskAssessment {
  id: string;
  name: string;
  description: string;
  status: string;
  targetDate: string;
  owner: string;
  risksInScope: string[]; // Array of Risk IDs
  progress: number;
  lastUpdated: string;
  // Enhanced fields for project creation
  project?: string;
  version?: string;
  riskMatrix?: string;
  authors?: string;
  reviewers?: string;
  dueDate?: string;
}

export interface Control {
  id: string;
  name: string;
  description: string;
  type: 'Preventive' | 'Detective' | 'Corrective';
  owner: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annual';
  status: 'Effective' | 'Ineffective' | 'Active' | 'Inactive' | 'Pending' | 'Retired';
  category?: 'Technical' | 'Administrative' | 'Physical';
  frameworks: string[];
  frameworkId: string;
  tags?: string[];
  customValues?: Record<string, any>;
  controlSchema?: ControlFieldDefinition[];
  // Renamed properties
  dueDate?: string;
  expiryDate?: string;
  link?: string;
  effort?: 'Low' | 'Medium' | 'High';
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  category: 'Information' | 'Software' | 'Hardware' | 'Service' | 'People';
  owner: string; // Business Custodian
  technicalOwner: string;
  businessUnit: string;
  classification: 'Internal' | 'Public' | 'Confidential' | 'Restricted';
  criticality: Severity;
  createdAt: string;
  customFields: Record<string, any>;
}

export type PipelineStage = 'To Do' | 'In Progress' | 'In Review' | 'Completed';

export interface Project {
  id: string;
  name: string;
  key: string;
  description: string;
  owner: string;
  createdAt: string;
  startDate: string;
  endDate: string;
}

export interface PipelineTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  severity: Severity;
  stage: PipelineStage;
  owner: string;
  startDate: string;
  dueDate: string;
  progress: number;
}

export enum NavigationTab {
  Dashboard = 'dashboard',
  Assets = 'assets',
  Risks = 'risks',
  RiskAssessment = 'risk-assessment',
  Controls = 'controls',
  Frameworks = 'frameworks',
  Evidence = 'evidence',
  Compliance = 'compliance',
  ComplianceAssessment = 'compliance-assessment',
  ComplianceAudit = 'compliance-audit',
  Pipeline = 'pipeline',
  AuditLog = 'audit-log',
  Settings = 'settings',
  Profile = 'profile',
}
