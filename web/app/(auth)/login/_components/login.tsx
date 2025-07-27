'use client';

import { z } from 'zod';

import { useForm } from 'react-hook-form';

import { useSearchParams } from 'next/navigation';

import { Link } from '@/components/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import authService, { AuthError } from '@/lib/auth';
import { zodResolver } from '@hookform/resolvers/zod';

const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
    remember_me: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Login() {
    const searchParams = useSearchParams();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
        clearErrors,
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            remember_me: false,
        },
    });

    const onSubmit = async (data: LoginFormData) => {
        clearErrors();

        try {
            await authService.login(data);
            location.assign(`/?${searchParams.toString()}`);
        } catch (error: unknown) {
            if (error instanceof AuthError) {
                Object.entries(error.errors).forEach(([field, messages]) => {
                    setError(field as keyof LoginFormData, {
                        type: 'server',
                        message: messages[0],
                    });
                });
            } else {
                setError('root', {
                    type: 'server',
                    message:
                        error instanceof Error
                            ? error.message
                            : 'Invalid email or password',
                });
            }
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            {errors.root && (
                <div className="mb-4 text-sm text-red-600">
                    {errors.root.message}
                </div>
            )}

            <div className="flex flex-col space-y-1">
                <label htmlFor="email">Email address</label>
                <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                    <span className="text-sm text-red-600">
                        {errors.email.message}
                    </span>
                )}
            </div>

            <div className="flex flex-col space-y-1">
                <label htmlFor="password">Password</label>
                <Input
                    id="password"
                    type="password"
                    {...register('password')}
                    className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && (
                    <span className="text-sm text-red-600">
                        {errors.password.message}
                    </span>
                )}
            </div>

            <div className="flex items-center space-x-4 pt-4">
                <Button
                    className="flex-grow"
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Logging in...' : 'Log in'}
                </Button>
                <Link
                    href={{
                        pathname: '/forgot-password',
                        query: searchParams.toString(),
                    }}
                >
                    Forgot password?
                </Link>
            </div>
        </form>
    );
}
