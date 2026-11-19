import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card';
import { ShieldCheck, Info } from 'lucide-react';

// =============================================================================
// Login Form Component
// Authenticates user against Supabase Auth and loads active CRM workspace
// =============================================================================

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Step 1: Handle login form submission
  const onSubmit = async (values: LoginFormValues) => {
    try {
      setErrorMessage(null);
      console.log(`[LoginForm] Step 1: Authenticating user credentials for: ${values.email}`);

      // Step 2: Dispatch authentication request to Supabase Auth & refresh profile
      await login(values.email, values.password);

      console.log('[LoginForm] Step 2: Authentication successful. Navigating to application...');
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials. Please verify your email and password.';
      console.warn('[LoginForm] Step 1: Authentication failure:', msg);
      setErrorMessage(msg);
    }
  };

  return (
    <Card className="w-full shadow-lg border-surface-200">
      <CardHeader className="text-center pb-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 mx-auto mb-3 shadow-xs">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-surface-900">
          Sign In to Nexora CRM
        </CardTitle>
        <CardDescription className="text-surface-500">
          Enter your authorized credentials to access your organization workspace.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errorMessage && (
            <Alert variant="error" title="Sign In Error">
              {errorMessage}
            </Alert>
          )}

          <Input
            label="Email Address"
            type="email"
            placeholder="name@company.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-surface-700 uppercase tracking-wider">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-brand-600 hover:text-brand-700 font-medium hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          <Button
            type="submit"
            className="w-full mt-2"
            size="lg"
            isLoading={isSubmitting}
          >
            Sign In
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t border-surface-100 py-3.5 bg-surface-50/50">
        <div className="flex items-start gap-2 text-left">
          <Info className="w-3.5 h-3.5 text-surface-400 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-surface-500 leading-relaxed">
            Nexora uses organization-controlled access. If you need an account, please contact your organization administrator to receive an invitation.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
};
