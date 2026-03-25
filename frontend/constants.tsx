
import React from 'react';
import { LayoutDashboard, Shield, AlertTriangle, Box, FileText, ClipboardList, Settings, Activity, Kanban, Library, ListCheck, FileSearch } from 'lucide-react';
import { NavigationTab, Risk, Control, Framework, Assessment, Asset, PipelineTask, Project, RiskAssessment } from './types';

export const NAVIGATION_ITEMS = [
  { id: NavigationTab.Dashboard, label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: NavigationTab.Assets, label: 'Asset Inventory', icon: <Box size={20} /> },
  { 
    id: NavigationTab.Risks, 
    label: 'Risk Management', 
    icon: <AlertTriangle size={20} />,
    subItems: [
      { id: NavigationTab.RiskAssessment, label: 'Risk Assessment', icon: <FileSearch size={14} /> }
    ]
  },
  { id: NavigationTab.Frameworks, label: 'Frameworks', icon: <Library size={20} /> },
  { id: NavigationTab.Controls, label: 'Controls', icon: <Shield size={20} /> },
  { id: NavigationTab.Evidence, label: 'Evidence', icon: <FileText size={20} /> },
  { 
    id: NavigationTab.Compliance, 
    label: 'Compliance', 
    icon: <ClipboardList size={20} />,
    subItems: [
      { id: NavigationTab.ComplianceAssessment, label: 'Assessment', icon: <ClipboardList size={14} /> },
      { id: NavigationTab.ComplianceAudit, label: 'Audit', icon: <ListCheck size={14} /> }
    ]
  },
  { id: NavigationTab.Pipeline, label: 'Pipeline', icon: <Kanban size={20} /> },
  { id: NavigationTab.AuditLog, label: 'Audit Log', icon: <Activity size={20} /> },
  { id: NavigationTab.Settings, label: 'Settings', icon: <Settings size={20} /> },
];

export const MOCK_RISK_ASSESSMENTS: RiskAssessment[] = [
  {
    id: 'RA-01',
    name: 'Annual Cyber Risk Assessment 2024',
    description: 'A comprehensive review of the cyber threat landscape and existing mitigations across all cloud properties.',
    status: 'In Progress',
    targetDate: '2024-12-31',
    owner: 'Alex Rivera',
    risksInScope: ['R-01', 'R-02'],
    progress: 45,
    lastUpdated: '2024-11-20',
    riskMatrix: 'critical 5x5',
    version: '1.0'
  },
  {
    id: 'RA-02',
    name: 'Q3 Financial Control Review',
    description: 'Focused assessment on financial reporting risks and ledger integrity safeguards.',
    status: 'Completed',
    targetDate: '2024-09-30',
    owner: 'Sarah Connor',
    risksInScope: ['R-01'],
    progress: 100,
    lastUpdated: '2024-09-25',
    riskMatrix: 'Standard 3x3',
    version: '1.0'
  }
];

export const MOCK_PROJECTS: Project[] = [
  { 
    id: 'PROJ-1', 
    name: 'SOX Compliance 2024', 
    key: 'SOX', 
    description: 'Yearly SOX controls evaluation and remediation.', 
    owner: 'Alex Rivera', 
    createdAt: '2024-01-10',
    startDate: '2024-01-10',
    endDate: '2024-12-31'
  },
  { 
    id: 'PROJ-2', 
    name: 'Cloud Migration Security', 
    key: 'CLOUD', 
    description: 'Reviewing security architecture for the new AWS migration.', 
    owner: 'Alex Rivera', 
    createdAt: '2024-02-15',
    startDate: '2024-03-01',
    endDate: '2024-11-15'
  },
];

export const MOCK_FRAMEWORKS: Framework[] = [
  { id: 'ISO27001', name: 'ISO/IEC 27001', version: '2022', totalControls: 93, description: 'International standard for information security management systems (ISMS). Focuses on Annex A controls covering organizational, people, physical, and technological domains.', isCustom: false },
  { id: 'NIST-CSF', name: 'NIST CSF', version: '2.0', totalControls: 108, description: 'Framework for improving critical infrastructure cybersecurity through Identify, Protect, Detect, Respond, and Recover functions.', isCustom: false },
  { id: 'SOC2', name: 'SOC 2 Type II', version: '2023', totalControls: 64, description: 'Trust Services Criteria for security, availability, processing integrity, confidentiality, and privacy.', isCustom: false },
];

export const MOCK_CONTROLS: Control[] = [
  { id: 'ISO-A.5.1', name: 'Policies for InfoSec', description: 'Information security policies shall be defined, approved by management, published and communicated to employees and relevant external parties.', type: 'Preventive', owner: 'Compliance Team', frequency: 'Annual', status: 'Effective', frameworks: ['ISO27001'], tags: ['Governance', 'Policy'] },
  { id: 'ISO-A.5.15', name: 'Access Control', description: 'Rules to control physical and logical access to information and other associated assets shall be established and implemented based on business and information security requirements.', type: 'Preventive', owner: 'Identity Team', frequency: 'Monthly', status: 'Effective', frameworks: ['ISO27001'], tags: ['IAM', 'Security'] },
  { id: 'ISO-A.8.1', name: 'User Endpoint Devices', description: 'Information stored on, processed by or accessible via user endpoint devices shall be protected.', type: 'Detective', owner: 'IT Ops', frequency: 'Daily', status: 'Effective', frameworks: ['ISO27001'], tags: ['Endpoints', 'IT'] },
  { id: 'ISO-A.8.10', name: 'Information Deletion', description: 'Information stored in information systems, devices or in any other storage media shall be deleted when no longer required.', type: 'Corrective', owner: 'Data Privacy', frequency: 'Quarterly', status: 'Ineffective', frameworks: ['ISO27001'], tags: ['Privacy', 'Data'] },
  { id: 'ISO-A.8.20', name: 'Network Security', description: 'Networks and network devices shall be secured, managed and controlled to protect information in systems and applications.', type: 'Preventive', owner: 'NetSec', frequency: 'Weekly', status: 'Effective', frameworks: ['ISO27001'], tags: ['Network', 'Infrastructure'] },
  { id: 'C-101', name: 'WAF Protection', description: 'Web Application Firewall filtering malicious traffic.', type: 'Preventive', owner: 'Network Sec', frequency: 'Daily', status: 'Effective', frameworks: ['NIST-CSF', 'SOC2'], tags: ['Cyber', 'AppSec'] },
  { id: 'C-202', name: 'Region Failover', description: 'Automatic failover to secondary AWS region.', type: 'Corrective', owner: 'SRE Team', frequency: 'Annual', status: 'Effective', frameworks: ['NIST-CSF'], tags: ['Availability', 'Cloud'] },
];

export const MOCK_RISKS: Risk[] = [
  { 
    id: 'R-01', 
    title: 'Data Breach of PII', 
    description: 'Unauthorized access to customer personally identifiable information via SQL injection on the legacy payment portal.',
    category: 'Cyber', 
    subcategory: 'Data Privacy',
    status: 'Active',
    trend: 'Worsening',
    businessUnit: 'Consumer Banking',
    department: 'Digital Product',
    location: 'NAM',
    owner: 'Sarah Connor',
    technicalOwner: 'John Doe',
    linkedAssets: ['AST-441'],
    customAssets: [],
    inherentLikelihood: 4, 
    inherentImpact: 5,
    inherentScore: 20, 
    residualLikelihood: 2, 
    residualImpact: 5, 
    residualScore: 10, 
    controlEffectiveness: 'Effective',
    linkedControls: ['ISO-A.5.15'],
    customControls: [],
    treatment: {
      option: 'Mitigate',
      actionPlan: 'Implement WAF and conduct monthly penetration testing.',
      owner: 'SecOps Team',
      targetDate: '2024-12-31',
      priority: 'P1',
      approvalStatus: 'Approved'
    },
    reviewFrequency: 'Quarterly',
    lastReviewDate: '2023-12-01',
    nextReviewDate: '2024-03-01',
    createdAt: '2023-01-15',
    history: [],
    linkedRequirements: [],
    appetiteThreshold: 15
  },
  { 
    id: 'R-02', 
    title: 'Cloud Service Outage', 
    description: 'Major AWS region failure leading to downtime of Core Banking services across Western Europe.',
    category: 'Operational', 
    subcategory: 'Availability',
    status: 'Active',
    trend: 'Stable',
    businessUnit: 'Global IT',
    department: 'Infrastructure',
    location: 'EMEA',
    owner: 'Robert T.',
    technicalOwner: 'Alice Smith',
    linkedAssets: ['AST-992'],
    customAssets: ['Cloud AWS Region West'],
    inherentLikelihood: 2, 
    inherentImpact: 5,
    inherentScore: 10, 
    residualLikelihood: 1, 
    residualImpact: 4, 
    residualScore: 4, 
    controlEffectiveness: 'Effective',
    linkedControls: ['C-202'],
    customControls: ['Third-party Cloud Monitoring'],
    treatment: {
      option: 'Mitigate',
      actionPlan: 'Enable multi-region failover and backup restoration testing.',
      owner: 'Cloud Architect',
      targetDate: '2024-06-15',
      priority: 'P1',
      approvalStatus: 'Approved'
    },
    reviewFrequency: 'Annual',
    lastReviewDate: '2023-08-15',
    nextReviewDate: '2024-08-15',
    createdAt: '2023-02-20',
    history: [],
    linkedRequirements: [],
    appetiteThreshold: 15
  }
];

export const MOCK_ASSETS: Asset[] = [
  { id: 'AST-441', name: 'Payment Gateway', type: 'Application', category: 'Software', owner: 'Sarah Connor', technicalOwner: 'John Doe', businessUnit: 'Finance', classification: 'Confidential', criticality: 'Critical', createdAt: '2023-01-10', customFields: {} },
  { id: 'AST-992', name: 'Core Database', type: 'Database', category: 'Software', owner: 'Robert T.', technicalOwner: 'Alice Smith', businessUnit: 'Engineering', classification: 'Restricted', criticality: 'High', createdAt: '2023-05-22', customFields: {} },
];

export const MOCK_PIPELINE_TASKS: PipelineTask[] = [
  { id: 'TK-101', projectId: 'PROJ-1', title: 'Update Firewall Rules', description: 'Block inbound traffic from untrusted subnets identified in last scan.', severity: 'High', stage: 'To Do', owner: 'Alex Rivera', startDate: '2024-11-01', dueDate: '2024-12-01', progress: 0 },
  { id: 'TK-102', projectId: 'PROJ-1', title: 'Employee Security Training', description: 'Quarterly phishing simulation and awareness.', severity: 'Medium', stage: 'In Progress', owner: 'Alex Rivera', startDate: '2024-10-15', dueDate: '2024-11-15', progress: 45 },
  { id: 'TK-103', projectId: 'PROJ-2', title: 'AWS Security Group Audit', description: 'Review all inbound/outbound rules for the migration VPC.', severity: 'High', stage: 'To Do', owner: 'Alex Rivera', startDate: '2024-11-20', dueDate: '2024-12-15', progress: 10 },
];

export const MOCK_ASSESSMENTS: Assessment[] = [
  { id: 'AS-8812', frameworkId: 'ISO27001', name: 'Q4 Internal Audit', progress: 65, status: 'In Progress', lastUpdated: '2023-11-20', author: 'Alex Rivera', version: '1.0', project: 'Compliance 2023' },
];
