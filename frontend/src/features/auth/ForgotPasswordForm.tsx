import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

// =============================================================================
// Forgot Password Form Component
// Dispatches password reset instruction emails via Supabase Auth
// =============================================================================

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordForm: React.FC = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  // Step 1: Send reset password email
  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      setErrorMessage(null);
      console.log(`[ForgotPasswordForm] Step 1: Requesting reset email for: ${values.email}`);

      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      console.log('[ForgotPasswordForm] Password reset email dispatched successfully.');
      setIsSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send password reset email.';
      console.warn('[ForgotPasswordForm] Error:', msg);
      setErrorMessage(msg);
    }
  };

  return (
    <Card className="w-full shadow-lg border-surface-200">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight text-surface-900">
          Reset Password
        </CardTitle>
        <CardDescription className="text-surface-500">
          We'll send password recovery instructions to your email.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isSuccess ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="text-base font-semibold text-surface-900">Check your inbox</h4>
            <p className="text-xs text-surface-600 leading-relaxed max-w-xs mx-auto">
              If an account matches that email, we've sent instructions to reset your password.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errorMessage && (
              <Alert variant="error" title="Error">
                {errorMessage}
              </Alert>
            )}

            <Input
              label="Work Email Address"
              type="email"
              placeholder="name@company.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={isSubmitting}
            >
              Send Reset Link
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="justify-center border-t border-surface-100 py-4 bg-surface-50/50">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-surface-600 hover:text-surface-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sign In
        </Link>
      </CardFooter>
    </Card>
  );
};
