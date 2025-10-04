'use client';

import { useRef } from 'react';

import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSubContent,
    DropdownMenuSubRoot,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import authService from '@/lib/auth';
import { store } from '@/lib/store';
import { useSelector } from '@xstate/store/react';

import { BalanceDiff } from './balance-diff';
import { Link } from './link';
import { LogsPopover } from './logs-popover';
import { PlotsPopover } from './plots-popover';
import { PopoverTrigger } from './ui/popover';

export function Footer() {
    const searchParams = useSearchParams();

    const user = useSelector(store, (state) => state.context.user);
    const ref = useRef<HTMLButtonElement>(null);
    return (
        <footer className="text-md fixed bottom-3 left-3 flex w-min flex-col items-center justify-between font-medium text-primary sm:flex-row">
            <div className="mb-3 flex items-center justify-between space-x-3 sm:mb-0">
                {user != null ? (
                    <>
                        <LogsPopover anchor={ref}>
                            <DropdownMenu>
                                <DropdownMenuTrigger ref={ref}>
                                    <span className="whitespace-nowrap">
                                        {user.email} (<BalanceDiff />)
                                    </span>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <PopoverTrigger
                                        nativeButton={false}
                                        render={(props) => (
                                            <DropdownMenuItem {...props}>
                                                logs
                                            </DropdownMenuItem>
                                        )}
                                    />
                                    <DropdownMenuItem
                                        onClick={authService.logout}
                                    >
                                        logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </LogsPopover>
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

                <div>/</div>

                <PlotsPopover>
                    <PopoverTrigger
                        render={(props) => (
                            <button
                                {...props}
                                className="svg-outline-sm relative no-underline"
                            >
                                plots
                            </button>
                        )}
                    />
                </PlotsPopover>
                <div>/</div>

                <DropdownMenu>
                    <DropdownMenuTrigger aria-label="Open general menu">
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <circle cx="4" cy="8" r="1" fill="currentColor" />
                            <circle cx="8" cy="8" r="1" fill="currentColor" />
                            <circle cx="12" cy="8" r="1" fill="currentColor" />
                        </svg>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem
                            render={(props) => (
                                <NextLink
                                    {...props}
                                    href={{
                                        pathname: '/about',
                                        query: searchParams.toString(),
                                    }}
                                >
                                    about
                                </NextLink>
                            )}
                        />
                        <DropdownMenuItem
                            render={(props) => (
                                <NextLink
                                    {...props}
                                    href={{
                                        pathname: '/changelog',
                                        query: searchParams.toString(),
                                    }}
                                >
                                    changelog
                                </NextLink>
                            )}
                        />
                        <DropdownMenuSubRoot>
                            <DropdownMenuSubTrigger>
                                legal
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent
                                positionerProps={{
                                    align: 'end',
                                    alignOffset: -1.5,
                                }}
                            >
                                <DropdownMenuItem
                                    render={(props) => (
                                        <NextLink
                                            {...props}
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
                                            href={{
                                                pathname: '/terms-of-service',
                                                query: searchParams.toString(),
                                            }}
                                        >
                                            terms
                                        </NextLink>
                                    )}
                                />
                            </DropdownMenuSubContent>
                        </DropdownMenuSubRoot>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </footer>
    );
}
