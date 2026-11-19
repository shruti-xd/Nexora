import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Check,
  DollarSign,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { accountService } from '../services/accountService';
import { contactService } from '../services/contactService';
import { leadService } from '../services/leadService';
import { Lead } from '../types/lead.types';

export const DashboardPlaceholderPage: React.FC = () => {
  const { user, organization, role } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [accountCount, setAccountCount] = useState(0);
  const [contactCount, setContactCount] = useState(0);
  const [openRevenue, setOpenRevenue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [leadResponse, accounts, contacts] = await Promise.all([
          leadService.listLeads({ page: 1, limit: 100 }),
          accountService.getAccounts(),
          contactService.getContacts(),
        ]);
        setLeads(leadResponse.leads);
        setAccountCount(accounts.length);
        setContactCount(contacts.length);
        setOpenRevenue(
          accounts.reduce(
            (total, account) => total + Number(account.annual_revenue || 0),
            0
          )
        );
      } finally {
        setIsLoading(false);
      }
    };
    void loadDashboard();
  }, []);

  const activeLeads = leads.filter((lead) => lead.status !== 'Converted');
  const convertedLeads = leads.filter((lead) => lead.status === 'Converted');
  const pipelineTotal = leads.reduce(
    (total, lead) => total + Number(lead.estimated_value || 0),
    0
  );
  const winRate = leads.length
    ? Math.round((convertedLeads.length / leads.length) * 100)
    : 0;

  const stages = [
    { id: 'New', label: 'New', probability: 10, color: 'bg-sky-500' },
    { id: 'Contacted', label: 'Contacted', probability: 35, color: 'bg-amber-500' },
    { id: 'Qualified', label: 'Qualified', probability: 70, color: 'bg-emerald-500' },
    { id: 'Converted', label: 'Converted', probability: 100, color: 'bg-indigo-600' },
  ];
  const stageData = stages.map((stage) => {
    const matching = leads.filter((lead) => lead.status === stage.id);
    return {
      ...stage,
      count: matching.length,
      total: matching.reduce(
        (sum, lead) => sum + Number(lead.estimated_value || 0),
        0
      ),
    };
  });
  const maxStageTotal = Math.max(...stageData.map((stage) => stage.total), 1);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-surface-200 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-surface-900">
              Welcome back, {user?.fullName || 'User'}
            </h1>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full border bg-brand-50 text-brand-700 border-brand-200">
              {role || 'USER'}
            </span>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-surface-100 text-surface-700 border border-surface-200">
              {organization?.name || 'Workspace'}
            </span>
          </div>
          <p className="text-xs text-surface-500 mt-1.5">
            CRM overview for <strong>{organization?.name || 'your organization'}</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">Open Pipeline</span>
            <div className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-surface-900">
            {isLoading ? '...' : formatCurrency(pipelineTotal)}
          </div>
          <div className="mt-1 text-xs text-surface-500">
            Across <span className="font-semibold text-surface-700">{activeLeads.length}</span> active leads
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">Account Revenue</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-surface-900">
            {isLoading ? '...' : formatCurrency(openRevenue)}
          </div>
          <div className="mt-1 text-xs text-emerald-600 font-medium">
            {accountCount} company accounts
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">Active Leads</span>
            <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-surface-900">
            {isLoading ? '...' : activeLeads.length}
          </div>
          <Link to="/leads" className="mt-1 text-xs text-brand-600 hover:text-brand-800 font-medium inline-flex items-center gap-1">
            <span>Review qualification queue</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">Contacts & Win Rate</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-2xl font-bold text-surface-900">{isLoading ? '...' : contactCount}</span>
            <span className="text-xs font-medium text-surface-500">contacts</span>
            <span className="ml-auto text-sm font-bold text-emerald-600">{winRate}% Win</span>
          </div>
          <Link to="/contacts" className="mt-1 text-xs text-brand-600 hover:text-brand-800 font-medium inline-flex items-center gap-1">
            <span>Open contact directory</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-surface-200 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-surface-900">Pipeline by Stage</h2>
              <p className="text-xs text-surface-500">Live lead distribution and deal value</p>
            </div>
            <Link to="/leads" className="text-xs font-semibold text-brand-600 hover:text-brand-800 inline-flex items-center gap-1">
              <span>Open Leads</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-4">
            {stageData.map((stage) => {
              const widthPct = Math.max(Math.round((stage.total / maxStageTotal) * 100), stage.total > 0 ? 6 : 0);
              return (
                <div key={stage.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
                      <span className="font-semibold text-surface-800">{stage.label}</span>
                      <span className="text-surface-400">({stage.count} leads · {stage.probability}%)</span>
                    </div>
                    <span className="font-bold text-surface-900">{formatCurrency(stage.total)}</span>
                  </div>
                  <div className="w-full h-2.5 bg-surface-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${stage.color}`} style={{ width: `${widthPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-surface-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-surface-900">Recent Leads</h2>
              <p className="text-xs text-surface-500">Latest prospects in your workspace</p>
            </div>
            <Link to="/leads" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 text-xs font-semibold text-surface-700 transition">
              <Users className="h-3.5 w-3.5" />
              <span>View Leads</span>
            </Link>
          </div>
          <div className="space-y-3">
            {leads.slice(0, 6).map((lead) => (
              <Link key={lead.id} to="/leads" className="p-3 rounded-xl border border-surface-200/80 bg-surface-50/50 hover:bg-white flex items-start justify-between gap-2 transition">
                <div className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-brand-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-surface-900">{lead.first_name} {lead.last_name}</div>
                    <p className="text-xs text-surface-600 mt-0.5">{lead.company} · {lead.status}</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-surface-200 text-surface-600">
                  {lead.source || 'Direct'}
                </span>
              </Link>
            ))}
            {leads.length === 0 && (
              <div className="p-8 text-center rounded-xl border border-dashed border-surface-200 text-xs text-surface-500">
                No leads have been created yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
