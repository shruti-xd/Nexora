import React, { useState } from 'react';
import { platformService } from '../../services/platformService';
import { PlatformOrganization, OrganizationStatus } from '../../types';
import { Modal } from '../../components/ui/modal';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

// =============================================================================
// Organization Status Modal
// Enables Platform Admins to activate or suspend tenant organizations
// =============================================================================

export interface OrganizationStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  org: PlatformOrganization | null;
  onSuccess: () => void;
}

export const OrganizationStatusModal: React.FC<OrganizationStatusModalProps> = ({
  isOpen,
  onClose,
  org,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!org) return null;

  const isCurrentlyActive = org.status === 'ACTIVE';
  const targetStatus: OrganizationStatus = isCurrentlyActive ? 'SUSPENDED' : 'ACTIVE';

  // Step 1: Submit status change
  const handleToggle = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      console.log(
        `[OrganizationStatusModal] Step 1: Changing organization "${org.name}" status from ${org.status} to ${targetStatus}`
      );

      // Step 2: Call backend platform API
      await platformService.updateOrganizationStatus(org.id, targetStatus);

      console.log(`[OrganizationStatusModal] Step 2: Organization status updated to ${targetStatus}`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update organization status.';
      console.error('[OrganizationStatusModal] Status update error:', msg);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCurrentlyActive ? 'Suspend Organization' : 'Activate Organization'}
      description={`Update platform access state for ${org.name}.`}
      className="max-w-md"
    >
      <div className="space-y-4">
        {errorMessage && (
          <Alert variant="error" title="Action Error">
            {errorMessage}
          </Alert>
        )}

        <div className="p-3 bg-surface-50 border border-surface-200 rounded-lg text-xs space-y-2">
          <p className="text-surface-700">
            <strong>Organization:</strong> {org.name} ({org.slug})
          </p>
          <p className="text-surface-700">
            <strong>Current Status:</strong>{' '}
            <span
              className={`font-semibold ${
                isCurrentlyActive ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              {org.status}
            </span>
          </p>
          <p className="text-surface-500 leading-relaxed">
            {isCurrentlyActive
              ? 'Suspending this organization will block all members from accessing their workspace, APIs, and CRM data until reactivated.'
              : 'Activating this organization will restore full access for all valid members.'}
          </p>
        </div>

        <div className="pt-2 flex items-center justify-end gap-3 border-t border-surface-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={isCurrentlyActive ? 'danger' : 'primary'}
            isLoading={isLoading}
            onClick={handleToggle}
          >
            {isCurrentlyActive ? (
              <>
                <ShieldAlert className="w-4 h-4 mr-1.5" />
                Suspend Organization
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 mr-1.5" />
                Activate Organization
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
