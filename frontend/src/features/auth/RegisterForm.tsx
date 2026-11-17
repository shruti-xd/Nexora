import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card';
import { CheckCircle2 } from 'lucide-react';

// =============================================================================
// Registration Form Component
// Handles user registration, workspace creation, and automatic admin role binding
// =============================================================================

// Step 1: Client-side validation schema matching backend rules
const registerFormSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name cannot exceed 100 characters'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
    confirmPassword: z.string(),
    organizationName: z
      .string()
      .trim()
      .min(2, 'Organization name must be at least 2 characters')
      .max(100, 'Organization name cannot exceed 100 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const RegisterForm: React.FC = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      organizationName: '',
    },
  });

  // Step 2: Handle registration form submission
  const onSubmit = async (values: RegisterFormValues) => {
    try {
      setErrorMessage(null);
      console.log(`[RegisterForm] Step 2: Submitting registration for email: ${values.email}`);

      await registerUser(values);

      console.log('[RegisterForm] Registration completed successfully. Redirecting...');
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      console.error('[RegisterForm] Error occurred during registration:', msg);
      setErrorMessage(msg);
    }
  };

  return (
    <Card className="w-full shadow-lg border-surface-200">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight text-surface-900">
          Create your CRM Workspace
        </CardTitle>
        <CardDescription className="text-surface-500">
          Get started with your team organization in minutes.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="text-lg font-semibold text-surface-900">Workspace Provisioned!</h4>
            <p className="text-sm text-surface-600">
              Welcome aboard. Redirecting to your dashboard...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errorMessage && (
              <Alert variant="error" title="Registration Failed">
                {errorMessage}
              </Alert>
            )}

            <Input
              label="Company / Workspace Name"
              placeholder="e.g. Acme Corporation"
              error={errors.organizationName?.message}
              {...register('organizationName')}
            />

            <Input
              label="Your Full Name"
              placeholder="e.g. Jane Doe"
              error={errors.fullName?.message}
              {...register('fullName')}
            />

            <Input
              label="Work Email Address"
              type="email"
              placeholder="name@company.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              helperText="Min. 8 characters with upper, lower, number & symbol"
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={isSubmitting}
            >
              Create Account & Workspace
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="justify-center border-t border-surface-100 py-4 bg-surface-50/50">
        <p className="text-xs text-surface-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">
            Sign In
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
};
