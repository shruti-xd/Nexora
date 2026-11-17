import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Building,
  Users2,
  Lock,
  ArrowRight,
  Database,
  CheckCircle,
} from 'lucide-react';

export const DashboardPlaceholderPage: React.FC = () => {
  const { user, organization, role, permissions } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-900 via-brand-800 to-surface-900 text-white shadow-md">
        <div className="max-w-3xl">
          <Badge variant="purple" className="mb-3 bg-brand-500/20 text-brand-200 border-brand-400/30">
            Module 01: Foundation Active
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            Welcome back, {user?.fullName || 'User'}
          </h2>
          <p className="text-sm text-brand-100/90 leading-relaxed">
            You are operating in the <strong className="text-white">{organization?.name}</strong> multi-tenant workspace with <strong className="text-white">{role}</strong> privileges.
          </p>
        </div>
      </div>

      {/* Module 01 Foundation Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Workspace Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Building className="w-5 h-5 text-brand-600" />
              <Badge variant="success">Active</Badge>
            </div>
            <CardTitle className="text-base mt-2">Active Workspace</CardTitle>
            <CardDescription>Multi-tenant organization boundary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-surface-100">
              <span className="text-surface-500">Name:</span>
              <span className="font-semibold text-surface-900">{organization?.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-100">
              <span className="text-surface-500">Workspace Slug:</span>
              <span className="font-mono text-surface-700">/{organization?.slug}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-surface-500">Workspace ID:</span>
              <span className="font-mono text-[10px] text-surface-500 truncate max-w-[130px]">{organization?.id}</span>
            </div>
          </CardContent>
        </Card>

        {/* Security & RBAC Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <Badge variant="purple">{role}</Badge>
            </div>
            <CardTitle className="text-base mt-2">RBAC & Identity</CardTitle>
            <CardDescription>Supabase Auth & Node.js Middleware</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-surface-100">
              <span className="text-surface-500">Identity Provider:</span>
              <span className="font-medium text-surface-900">Supabase Auth (GoTrue)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-100">
              <span className="text-surface-500">Token Type:</span>
              <span className="font-mono text-surface-700">Cryptographic JWT</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-surface-500">Permissions Count:</span>
              <span className="font-semibold text-brand-600">{permissions?.length || 0} granted</span>
            </div>
          </CardContent>
        </Card>

        {/* Database & RLS Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Database className="w-5 h-5 text-emerald-600" />
              <Badge variant="success">Enforced</Badge>
            </div>
            <CardTitle className="text-base mt-2">PostgreSQL & RLS</CardTitle>
            <CardDescription>Transactional isolation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-surface-100">
              <span className="text-surface-500">Row Level Security:</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Enabled
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-100">
              <span className="text-surface-500">Database Engine:</span>
              <span className="font-medium text-surface-900">Supabase PostgreSQL</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-surface-500">Atomic Setup:</span>
              <span className="font-mono text-[10px] text-surface-700">Stored Procedure</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Prompt */}
      <Card className="bg-surface-50/50 border-dashed">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0">
              <Users2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-surface-900">Manage Organization Team</h4>
              <p className="text-xs text-surface-500 mt-0.5">
                Inspect member directory, adjust permission roles, or activate and deactivate users.
              </p>
            </div>
          </div>
          <Link to="/users">
            <Button variant="primary" size="md">
              View Team Members
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Subsequent CRM Modules Roadmap */}
      <div>
        <h3 className="text-sm font-bold text-surface-700 uppercase tracking-wider mb-3">
          Upcoming CRM Business Modules
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'Leads Pipeline', module: 'Module 02', desc: 'Lead capture, qualification, assignment & conversion.' },
            { name: 'Accounts & Contacts', module: 'Module 03', desc: 'Company hierarchies, stakeholder profiles & relationship mapping.' },
            { name: 'Deals & Opportunities', module: 'Module 04', desc: 'Custom pipeline stages, probability forecasting & value tracking.' },
            { name: 'Activities & Tasks', module: 'Module 05', desc: 'Meeting logs, call notes, automated task reminders & timeline.' },
          ].map((item) => (
            <div
              key={item.name}
              className="p-4 rounded-xl bg-white border border-surface-200/80 shadow-xs relative opacity-75"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-medium text-surface-500 bg-surface-100 px-2 py-0.5 rounded">
                  {item.module}
                </span>
                <Lock className="w-3.5 h-3.5 text-surface-400" />
              </div>
              <h5 className="font-semibold text-surface-800 text-sm">{item.name}</h5>
              <p className="text-[11px] text-surface-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
