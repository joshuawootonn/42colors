'use client';

import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import authService from '@/lib/auth';
import { store } from '@/lib/store';
import { useSelector } from '@xstate/store/react';

import { Link } from './link';
import { PlotsPopover } from './plots-popover';
import { PopoverTrigger } from './ui/popover';

export function Footer() {
    const searchParams = useSearchParams();

    const user = useSelector(store, (state) => state.context.user);

    return (
        <footer className="text-md fixed bottom-3 left-3 flex w-min flex-col items-center justify-between font-medium text-primary sm:flex-row">
            <div className="mb-3 flex items-center justify-between space-x-3 sm:mb-0">
                <Link
                    href={{
                        pathname: '/about',
                        query: searchParams.toString(),
                    }}
                >
                    about
                </Link>
                <div>/</div>
                <Link
                    href={{
                        pathname: '/changelog',
                        query: searchParams.toString(),
                    }}
                >
                    changelog
                </Link>
                <div>/</div>
                <PlotsPopover>
                    <PopoverTrigger
                        render={(props) => (
                            <button
                                {...props}
                                className="svg-outline relative no-underline"
                            >
                                plots
                            </button>
                        )}
                    />
                </PlotsPopover>
                <div>/</div>
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={(props) => (
                            <button
                                {...props}
                                className="svg-outline relative no-underline"
                                aria-label="Customise options"
                            >
                                legal
                            </button>
                        )}
                    />

                    <DropdownMenuContent className="flex flex-col border-1.5 border-primary bg-secondary">
                        <DropdownMenuItem
                            render={(props) => (
                                <NextLink
                                    {...props}
                                    className="cursor-pointer px-2 py-1 no-underline outline-none focus:bg-primary focus:text-secondary"
                                    href={{
                                        pathname: '/privacy-policy',
                                        query: searchParams.toString(),
                                    }}
                                >
                                    privacy
                                </NextLink>
                            )}
                        />
                        <DropdownMenuItem
                            render={(props) => (
                                <NextLink
                                    {...props}
                                    className="cursor-pointer px-2 py-1 no-underline outline-none focus:bg-primary focus:text-secondary"
                                    href={{
                                        pathname: '/terms-of-service',
                                        query: searchParams.toString(),
                                    }}
                                >
                                    terms
                                </NextLink>
                            )}
                        />
                    </DropdownMenuContent>
                </DropdownMenu>
                <div>/ </div>
                {user != null ? (
                    <>
                        <div>{user.email}</div>
                        <div>/</div>
                        <button onClick={authService.logout}>logout</button>
                    </>
                ) : (
                    <>
                        <Link
                            href={{
                                pathname: '/login',
                                query: searchParams.toString(),
                            }}
                        >
                            login
                        </Link>
                        <div>or</div>
                        <Link
                            href={{
                                pathname: '/signup',
                                query: searchParams.toString(),
                            }}
                        >
                            signup
                        </Link>
                    </>
                )}
            </div>
        </footer>
    );
}
