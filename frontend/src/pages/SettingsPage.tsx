import React, { useState } from 'react';
import {
  Building,
  GitBranch,
  Lock,
  Settings,
  Sliders,
  User,
  UserCheck,
  Shield,
  Plus,
  Trash2,
  Edit3,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { organizationService } from '../services/organizationService';
import { authService } from '../services/authService';
import { UserList } from '../features/users/UserList';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Alert } from '../components/ui/alert';

type SetupTab = 'object-manager' | 'users' | 'roles' | 'profiles';
type ObjectPermissions = { read: boolean; create: boolean; edit: boolean; delete: boolean };
type CRMProfile = {
  id: string;
  name: string;
  description: string;
  manageSetup: boolean;
  viewAllData: boolean;
  permissions: Record<string, ObjectPermissions>;
};

interface CustomField {
  id: string;
  label: string;
  apiName: string;
  type: string;
  custom: boolean;
}

const crmObjects = ['Lead', 'Account', 'Contact', 'Opportunity'];
const permissionKeys = ['read', 'create', 'edit', 'delete'] as const;

const defaultProfiles: CRMProfile[] = [
  {
    id: 'admin',
    name: 'System Administrator',
    description: 'Full access to Setup, Object Manager, Users, Roles, Profiles, and all CRM data',
    manageSetup: true,
    viewAllData: true,
    permissions: {
      Lead: { read: true, create: true, edit: true, delete: true },
      Account: { read: true, create: true, edit: true, delete: true },
      Contact: { read: true, create: true, edit: true, delete: true },
      Opportunity: { read: true, create: true, edit: true, delete: true },
    },
  },
  {
    id: 'sales',
    name: 'Sales Manager',
    description: 'Manage team sales records and CRM pipeline',
    manageSetup: false,
    viewAllData: false,
    permissions: {
      Lead: { read: true, create: true, edit: true, delete: false },
      Account: { read: true, create: true, edit: true, delete: false },
      Contact: { read: true, create: true, edit: true, delete: false },
      Opportunity: { read: true, create: true, edit: true, delete: false },
    },
  },
  {
    id: 'user',
    name: 'Standard Sales User',
    description: 'Manage assigned CRM records',
    manageSetup: false,
    viewAllData: false,
    permissions: {
      Lead: { read: true, create: true, edit: true, delete: false },
      Account: { read: true, create: true, edit: true, delete: false },
      Contact: { read: true, create: true, edit: true, delete: false },
      Opportunity: { read: true, create: true, edit: true, delete: false },
    },
  },
  {
    id: 'viewer',
    name: 'Read Only User',
    description: 'View CRM records without modifying them',
    manageSetup: false,
    viewAllData: false,
    permissions: {
      Lead: { read: true, create: false, edit: false, delete: false },
      Account: { read: true, create: false, edit: false, delete: false },
      Contact: { read: true, create: false, edit: false, delete: false },
      Opportunity: { read: true, create: false, edit: false, delete: false },
    },
  },
];

export const SettingsPage: React.FC = () => {
  const { user, organization, role, refreshProfile } = useAuth();
  const isAdmin = role === 'ADMIN';
  const [setupTab, setSetupTab] = useState<SetupTab>('profiles');

  const [orgName, setOrgName] = useState(organization?.name || '');
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [isUpdatingOrg, setIsUpdatingOrg] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [orgSuccess, setOrgSuccess] = useState<string | null>(null);
  const [orgError, setOrgError] = useState<string | null>(null);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);

  const [profiles, setProfiles] = useState<CRMProfile[]>(defaultProfiles);
  const [selectedProfileId, setSelectedProfileId] = useState('admin');
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDesc, setNewProfileDesc] = useState('');

  const [selectedObject, setSelectedObject] = useState('Lead');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState('Text');
  const [fields, setFields] = useState<Record<string, CustomField[]>>({
    Lead: [
      { id: 'lead-name', label: 'Lead Name', apiName: 'name', type: 'Text', custom: false },
      { id: 'lead-company', label: 'Company', apiName: 'company', type: 'Text', custom: false },
      { id: 'lead-status', label: 'Lead Status', apiName: 'status', type: 'Picklist', custom: false },
      { id: 'lead-region', label: 'Sales Region', apiName: 'Lead_Region__c', type: 'Picklist', custom: true },
    ],
    Account: [
      { id: 'account-name', label: 'Account Name', apiName: 'name', type: 'Text', custom: false },
      { id: 'account-industry', label: 'Industry', apiName: 'industry', type: 'Text', custom: false },
      { id: 'account-city', label: 'Headquarters', apiName: 'city', type: 'Text', custom: false },
      { id: 'account-tier', label: 'Customer Tier', apiName: 'Account_Tier__c', type: 'Picklist', custom: true },
    ],
    Contact: [
      { id: 'contact-name', label: 'Contact Name', apiName: 'name', type: 'Text', custom: false },
      { id: 'contact-email', label: 'Email', apiName: 'email', type: 'Email', custom: false },
      { id: 'contact-title', label: 'Role / Title', apiName: 'title', type: 'Text', custom: false },
    ],
    Opportunity: [
      { id: 'opp-name', label: 'Opportunity Name', apiName: 'name', type: 'Text', custom: false },
      { id: 'opp-stage', label: 'Stage', apiName: 'stage', type: 'Picklist', custom: false },
      { id: 'opp-amount', label: 'Amount', apiName: 'amount', type: 'Currency', custom: false },
    ],
  });

  const activeProfile = profiles.find((profile) => profile.id === selectedProfileId) || profiles[0];
  const activeFields = fields[selectedObject] || [];

  const setupMenu = [
    { id: 'object-manager' as const, label: 'Object Manager', desc: 'Edit labels & add custom fields', icon: Sliders },
    { id: 'users' as const, label: 'Users & Login As', desc: 'Create/edit users & impersonate', icon: UserCheck },
    { id: 'roles' as const, label: 'Role Hierarchy', desc: 'Configure data visibility tree', icon: GitBranch },
    { id: 'profiles' as const, label: 'Profiles & Permissions', desc: 'Object CRUD & system access', icon: Lock },
  ];

  const updateProfile = (updater: (profile: CRMProfile) => CRMProfile) => {
    setProfiles((current) =>
      current.map((profile) => (profile.id === selectedProfileId ? updater(profile) : profile))
    );
  };

  const toggleObjectPermission = (objectName: string, key: keyof ObjectPermissions) => {
    updateProfile((profile) => {
      const current = profile.permissions[objectName];
      const nextValue = !current[key];
      return {
        ...profile,
        permissions: {
          ...profile.permissions,
          [objectName]: {
            ...current,
            [key]: nextValue,
            ...(key === 'read' && !nextValue ? { create: false, edit: false, delete: false } : {}),
          },
        },
      };
    });
  };

  const toggleSystemPermission = (key: 'manageSetup' | 'viewAllData') => {
    updateProfile((profile) => ({ ...profile, [key]: !profile[key] }));
  };

  const handleCreateProfile = (event: React.FormEvent) => {
    event.preventDefault();
    const name = newProfileName.trim();
    if (!name) return;
    if (profiles.some((profile) => profile.name.toLowerCase() === name.toLowerCase())) return;
    const created: CRMProfile = {
      id: `profile-${Date.now()}`,
      name,
      description: newProfileDesc.trim() || 'Custom access profile',
      manageSetup: false,
      viewAllData: false,
      permissions: Object.fromEntries(
        crmObjects.map((objectName) => [
          objectName,
          { read: true, create: true, edit: true, delete: false },
        ])
      ),
    };
    setProfiles((current) => [...current, created]);
    setSelectedProfileId(created.id);
    setNewProfileName('');
    setNewProfileDesc('');
  };

  const handleUpdateOrg = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setIsUpdatingOrg(true);
      setOrgError(null);
      setOrgSuccess(null);
      await organizationService.updateCurrent(orgName);
      await refreshProfile();
      setOrgSuccess('Organization name updated successfully.');
    } catch (error: unknown) {
      setOrgError(error instanceof Error ? error.message : 'Failed to update organization');
    } finally {
      setIsUpdatingOrg(false);
    }
  };

  const handleUpdateProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setIsUpdatingUser(true);
      setUserError(null);
      setUserSuccess(null);
      await authService.updateProfile(fullName);
      await refreshProfile();
      setUserSuccess('Profile updated successfully.');
    } catch (error: unknown) {
      setUserError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const addCustomField = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newFieldLabel.trim()) return;
    const apiName = `${newFieldLabel.trim().replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('_')}__c`;
    setFields((current) => ({
      ...current,
      [selectedObject]: [
        ...current[selectedObject],
        { id: `field-${Date.now()}`, label: newFieldLabel.trim(), apiName, type: newFieldType, custom: true },
      ],
    }));
    setNewFieldLabel('');
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-surface-200 p-2.5 space-y-1 shadow-xs">
          {setupMenu.map((item) => {
            const Icon = item.icon;
            const active = setupTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSetupTab(item.id)}
                className={`w-full p-3 rounded-xl text-left transition flex items-start gap-3 ${
                  active ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'hover:bg-surface-50 text-surface-700 border border-transparent'
                }`}
              >
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${active ? 'text-brand-600' : 'text-surface-400'}`} />
                <div>
                  <div className="text-sm font-bold">{item.label}</div>
                  <div className="text-[11px] text-surface-500">{item.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-9">
          {setupTab === 'profiles' && (
            <div className="space-y-5">
              <form onSubmit={handleCreateProfile} className="bg-white p-4 rounded-2xl border border-surface-200 shadow-xs">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-5">
                    <label className="block text-xs font-semibold text-surface-700 mb-1">Create New Profile Name</label>
                    <input value={newProfileName} onChange={(event) => setNewProfileName(event.target.value)} placeholder="e.g., Partner Channel Rep" className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div className="sm:col-span-5">
                    <label className="block text-xs font-semibold text-surface-700 mb-1">Description</label>
                    <input value={newProfileDesc} onChange={(event) => setNewProfileDesc(event.target.value)} placeholder="Access scope summary" className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div className="sm:col-span-2">
                    <button type="submit" className="w-full flex items-center justify-center gap-1 px-3 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold">
                      <Plus className="w-3.5 h-3.5" /> Create Profile
                    </button>
                  </div>
                </div>
              </form>

              <div className="flex flex-wrap gap-2">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => setSelectedProfileId(profile.id)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition ${
                      activeProfile.id === profile.id ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-surface-700 border-surface-200 hover:bg-surface-50'
                    }`}
                  >
                    {profile.name}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
                <div className="p-5 border-b border-surface-200 bg-surface-50">
                  <h3 className="text-base font-bold text-surface-900">{activeProfile.name}</h3>
                  <p className="text-xs text-surface-500 mt-1">{activeProfile.description}</p>
                  <div className="flex flex-wrap gap-3 mt-3">
                    <label className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-surface-200 text-xs font-semibold cursor-pointer">
                      <input type="checkbox" checked={activeProfile.manageSetup} onChange={() => toggleSystemPermission('manageSetup')} className="rounded text-brand-600" />
                      Manage Setup & Users
                    </label>
                    <label className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-surface-200 text-xs font-semibold cursor-pointer">
                      <input type="checkbox" checked={activeProfile.viewAllData} onChange={() => toggleSystemPermission('viewAllData')} className="rounded text-brand-600" />
                      View All Data (Bypass Hierarchy)
                    </label>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-surface-200 text-[11px] uppercase tracking-wider text-surface-500">
                        <th className="py-3 px-4">CRM Object</th>
                        {permissionKeys.map((key) => (
                          <th key={key} className="py-3 px-4 text-center">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                      {crmObjects.map((objectName) => (
                        <tr key={objectName} className="hover:bg-surface-50">
                          <td className="py-3.5 px-4 font-bold text-surface-900">{objectName}</td>
                          {permissionKeys.map((key) => (
                            <td key={key} className="py-3.5 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={Boolean(activeProfile.permissions[objectName][key])}
                                disabled={key !== 'read' && !activeProfile.permissions[objectName].read}
                                onChange={() => toggleObjectPermission(objectName, key)}
                                className="h-4 w-4 rounded text-brand-600 cursor-pointer disabled:opacity-40"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {setupTab === 'object-manager' && (
            <div className="space-y-5">
              <div className="bg-white p-4 rounded-2xl border border-surface-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-surface-900">Object Manager</h2>
                  <p className="text-xs text-surface-500">Select an object to review and add custom fields.</p>
                </div>
                <div className="flex flex-wrap gap-1.5 bg-surface-100 p-1 rounded-xl">
                  {crmObjects.map((objectName) => (
                    <button key={objectName} type="button" onClick={() => setSelectedObject(objectName)} className={`px-3.5 py-1.5 rounded-lg text-xs font-bold ${selectedObject === objectName ? 'bg-brand-600 text-white' : 'text-surface-600 hover:text-surface-900'}`}>
                      {objectName}
                    </button>
                  ))}
                </div>
              </div>
              <form onSubmit={addCustomField} className="bg-white p-5 rounded-2xl border border-surface-200 space-y-4">
                <h3 className="text-sm font-bold text-surface-900">Create New Custom Field on {selectedObject}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-5">
                    <label className="block text-xs font-semibold text-surface-700 mb-1">Field Label *</label>
                    <input value={newFieldLabel} onChange={(event) => setNewFieldLabel(event.target.value)} placeholder="e.g., GST Number" className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm" />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-semibold text-surface-700 mb-1">Data Type</label>
                    <select value={newFieldType} onChange={(event) => setNewFieldType(event.target.value)} className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm bg-white">
                      <option>Text</option><option>Number</option><option>Currency</option><option>Picklist</option><option>Date</option><option>Checkbox</option>
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <button type="submit" className="w-full py-2 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold"><Plus className="h-3.5 w-3.5 inline mr-1" />Add Custom Field</button>
                  </div>
                </div>
              </form>
              <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
                <div className="px-4 py-3 bg-surface-50 border-b border-surface-200 text-xs font-bold uppercase tracking-wider text-surface-600">{selectedObject} Fields ({activeFields.length})</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead><tr className="border-b border-surface-200 text-[10px] uppercase tracking-wider text-surface-500"><th className="py-2.5 px-4">Field Label</th><th className="py-2.5 px-4">API Name</th><th className="py-2.5 px-4">Type</th><th className="py-2.5 px-4">Origin</th><th className="py-2.5 px-4 text-right">Actions</th></tr></thead>
                    <tbody className="divide-y divide-surface-100">
                      {activeFields.map((field) => (
                        <tr key={field.id} className="hover:bg-surface-50">
                          <td className="py-3 px-4 font-semibold text-surface-900">{field.label}</td>
                          <td className="py-3 px-4 font-mono text-surface-600">{field.apiName}</td>
                          <td className="py-3 px-4 text-surface-700">{field.type}</td>
                          <td className="py-3 px-4"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${field.custom ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'bg-surface-100 text-surface-600'}`}>{field.custom ? 'Custom' : 'Standard'}</span></td>
                          <td className="py-3 px-4 text-right">{field.custom ? <button type="button" onClick={() => setFields((current) => ({ ...current, [selectedObject]: current[selectedObject].filter((item) => item.id !== field.id) }))} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button> : <Edit3 className="h-3.5 w-3.5 inline text-surface-400" />}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {setupTab === 'users' && <UserList />}

          {setupTab === 'roles' && (
            <div className="bg-white p-5 rounded-2xl border border-surface-200">
              <h2 className="text-base font-bold text-surface-900">Role Hierarchy</h2>
              <p className="text-xs text-surface-500 mb-4">Workspace roles and access levels.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[['ADMIN', 'Full workspace and organization access'], ['MANAGER', 'Team-level CRM management'], ['SALES_REP', 'Create and manage CRM records'], ['VIEWER', 'Read-only CRM access']].map(([name, description]) => (
                  <div key={name} className="p-4 rounded-xl border border-surface-200 bg-surface-50/50"><div className="font-bold text-surface-900">{name}</div><div className="text-xs text-surface-500 mt-1">{description}</div></div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
