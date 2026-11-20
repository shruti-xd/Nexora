import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { platformService } from '../services/platformService';
import { PlatformOrganization } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Building2,
  ShieldCheck,
  PlusCircle,
  Users,
  Activity,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

// =============================================================================
// Platform Overview Page
// Top-level platform administration dashboard for tenant health and governance
// =============================================================================

export const PlatformOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<PlatformOrganization[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [suspendedCount, setSuspendedCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 1: Fetch platform metrics and recent organizations
  const loadPlatformMetrics = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      console.log('[PlatformOverviewPage] Step 1: Loading platform metrics and recent organizations...');

      // Fetch page 1 (up to 100 orgs to calculate overview metrics)
      const data = await platformService.listOrganizations(1, 100);

      const orgs = data.organizations;
      const total = data.pagination.totalItems;
      const active = orgs.filter((o) => o.status === 'ACTIVE').length;
      const suspended = orgs.filter((o) => o.status === 'SUSPENDED').length;

      console.log(
        `[PlatformOverviewPage] Step 1: Metrics computed (Total: ${total}, Active: ${active}, Suspended: ${suspended})`
      );

      setOrganizations(orgs.slice(0, 5)); // Keep top 5 recent
      setTotalCount(total);
      setActiveCount(active);
      setSuspendedCount(suspended);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load platform overview metrics.';
      console.error('[PlatformOverviewPage] Error loading metrics:', msg);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlatformMetrics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3" />
              Platform Admin Control Plane
            </span>
          </div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">
            Multi-Tenant Platform Overview
          </h1>
          <p className="text-xs text-surface-500 mt-1">
            Global governance, tenant workspace provisioning, and centralized organization lifecycle management.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadPlatformMetrics}
            disabled={isLoading}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/platform-admin/organizations/new')}
            className="text-xs bg-purple-600 hover:bg-purple-700 text-white"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1" />
            Create Organization
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
          {errorMessage}
        </div>
      )}

      {/* Step 2: Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-surface-200 bg-white shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">
                  Total Organizations
                </p>
                <h3 className="text-2xl font-bold text-surface-900 mt-1">
                  {isLoading ? '...' : totalCount}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-surface-400 mt-3 flex items-center gap-1">
              <span>Managed tenant workspaces</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-surface-200 bg-white shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">
                  Active Workspaces
                </p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                  {isLoading ? '...' : activeCount}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-surface-400 mt-3 flex items-center gap-1">
              <span>Operational and accessible</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-surface-200 bg-white shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">
                  Suspended Tenants
                </p>
                <h3 className="text-2xl font-bold text-amber-600 mt-1">
                  {isLoading ? '...' : suspendedCount}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-surface-400 mt-3 flex items-center gap-1">
              <span>Access paused by platform</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-surface-200 bg-white shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">
                  Multi-Tenant Security
                </p>
                <h3 className="text-2xl font-bold text-surface-900 mt-1">
                  Salesforce RBAC
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-surface-400 mt-3 flex items-center gap-1">
              <span>Platform-enforced isolation</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Step 3: Quick Action Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-white border border-surface-200 rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mb-3">
              <PlusCircle className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-surface-900">Provision Organization</h3>
            <p className="text-xs text-surface-500 mt-1">
              Create a new customer tenant workspace, assign an organization slug, and invite the primary Organization Administrator.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-surface-100">
            <Button
              size="sm"
              onClick={() => navigate('/platform-admin/organizations/new')}
              className="w-full sm:w-auto text-xs bg-purple-600 hover:bg-purple-700 text-white"
            >
              Start Provisioning
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>

        <div className="p-5 bg-white border border-surface-200 rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center mb-3">
              <Building2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-surface-900">Manage Organizations</h3>
            <p className="text-xs text-surface-500 mt-1">
              Search organizations, filter by status, inspect member directories, update slugs, and activate or suspend tenant access.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-surface-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/platform-admin/organizations')}
              className="w-full sm:w-auto text-xs"
            >
              View All Organizations
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Step 4: Recent Organizations Table */}
      <div className="bg-white border border-surface-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-surface-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-surface-900">Recently Created Organizations</h3>
            <p className="text-xs text-surface-500">Latest tenant organizations provisioned across Nexora.</p>
          </div>
          <Link
            to="/platform-admin/organizations"
            className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-50/75 border-b border-surface-200 text-[11px] font-semibold text-surface-600 uppercase tracking-wider">
                <th className="py-2.5 px-4">Organization</th>
                <th className="py-2.5 px-4">Slug</th>
                <th className="py-2.5 px-4">Initial Administrator</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-surface-400">
                    Loading recent organizations...
                  </td>
                </tr>
              ) : organizations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-surface-400">
                    No organizations provisioned yet.
                  </td>
                </tr>
              ) : (
                organizations.map((org) => {
                  const admin = org.initialAdmin || org.admin;
                  const isActive = org.status === 'ACTIVE';

                  return (
                    <tr key={org.id} className="hover:bg-surface-50/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-surface-900">{org.name}</td>
                      <td className="py-3 px-4 text-surface-500 font-mono text-[11px]">/{org.slug}</td>
                      <td className="py-3 px-4">
                        {admin ? (
                          <div>
                            <span className="font-medium text-surface-800 block truncate">
                              {admin.fullName || 'Admin'}
                            </span>
                            <span className="text-[11px] text-surface-400 block truncate">
                              {admin.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-surface-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                            Suspended
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/platform-admin/organizations/${org.id}`}
                          className="text-purple-600 hover:text-purple-800 font-medium inline-flex items-center gap-1 text-[11px]"
                        >
                          <span>Manage</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
