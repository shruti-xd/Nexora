import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { organizationService } from '../services/organizationService';
import { authService } from '../services/authService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Alert } from '../components/ui/alert';
import { Building, User, Shield } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, organization, role, refreshProfile } = useAuth();
  const isAdmin = role === 'ADMIN';

  // Organization settings state
  const [orgName, setOrgName] = useState(organization?.name || '');
  const [isUpdatingOrg, setIsUpdatingOrg] = useState(false);
  const [orgSuccess, setOrgSuccess] = useState<string | null>(null);
  const [orgError, setOrgError] = useState<string | null>(null);

  // User profile state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);

  // Step 1: Update organization name
  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUpdatingOrg(true);
      setOrgError(null);
      setOrgSuccess(null);
      console.log(`[SettingsPage] Step 1: Updating organization name to "${orgName}"`);

      await organizationService.updateCurrent(orgName);
      await refreshProfile();
      setOrgSuccess('Organization name updated successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update organization';
      console.error('[SettingsPage] Error updating organization:', msg);
      setOrgError(msg);
    } finally {
      setIsUpdatingOrg(false);
    }
  };

  // Step 2: Update personal profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUpdatingUser(true);
      setUserError(null);
      setUserSuccess(null);
      console.log(`[SettingsPage] Step 2: Updating user profile full name to "${fullName}"`);

      await authService.updateProfile(fullName);
      await refreshProfile();
      setUserSuccess('Profile updated successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      console.error('[SettingsPage] Error updating profile:', msg);
      setUserError(msg);
    } finally {
      setIsUpdatingUser(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-surface-900 tracking-tight">Workspace & Account Settings</h2>
        <p className="text-xs text-surface-500 mt-1">
          Configure organization settings and manage your account profile.
        </p>
      </div>

      {/* Organization Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <Building className="w-5 h-5 text-brand-600" />
            <div>
              <CardTitle className="text-base">Workspace Configuration</CardTitle>
              <CardDescription>Primary organization workspace details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {orgSuccess && (
            <Alert variant="success" className="mb-4">
              {orgSuccess}
            </Alert>
          )}
          {orgError && (
            <Alert variant="error" className="mb-4">
              {orgError}
            </Alert>
          )}

          <form onSubmit={handleUpdateOrg} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Workspace Name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                disabled={!isAdmin || isUpdatingOrg}
              />
              <Input
                label="Workspace Slug (Read-only)"
                value={organization?.slug || ''}
                disabled
              />
            </div>

            <div className="text-xs text-surface-500">
              Workspace UUID: <span className="font-mono text-surface-700">{organization?.id}</span>
            </div>

            {isAdmin ? (
              <div className="pt-2">
                <Button type="submit" variant="primary" size="sm" isLoading={isUpdatingOrg}>
                  Update Workspace Name
                </Button>
              </div>
            ) : (
              <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                Only workspace Administrators can modify organization settings.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* User Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <User className="w-5 h-5 text-surface-600" />
            <div>
              <CardTitle className="text-base">Your Personal Profile</CardTitle>
              <CardDescription>Update your display name and view account details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {userSuccess && (
            <Alert variant="success" className="mb-4">
              {userSuccess}
            </Alert>
          )}
          {userError && (
            <Alert variant="error" className="mb-4">
              {userError}
            </Alert>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isUpdatingUser}
              />
              <Input
                label="Email Address"
                value={user?.email || ''}
                disabled
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-surface-600 bg-surface-50 p-3 rounded-lg border border-surface-200">
              <Shield className="w-4 h-4 text-purple-600 flex-shrink-0" />
              <span>
                Your current assigned role is <strong>{role}</strong> in <strong>{organization?.name}</strong>.
              </span>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="sm" isLoading={isUpdatingUser}>
                Save Profile
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
