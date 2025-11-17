'use client';

import { ReactNode, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverHeading,
} from '@/components/ui/popover';
import { isAdminUser } from '@/lib/admin';
import { grantPixels } from '@/lib/admin.rest';
import { store } from '@/lib/store';
import userService, { type SearchedUser } from '@/lib/user';
import { cn } from '@/lib/utils';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSelector } from '@xstate/store/react';

export function AdminPopover({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);
    const [grantAmount, setGrantAmount] = useState('');

    const currentUser = useSelector(store, (state) => state.context?.user);

    // Only show for admin user
    const isAdmin = isAdminUser(currentUser);

    const {
        data: searchResults,
        isLoading: isSearching,
        error: searchError,
    } = useQuery({
        queryKey: ['user-search', searchQuery],
        queryFn: () => userService.searchUsers(searchQuery),
        enabled: isOpen && isAdmin && searchQuery.length >= 2,
    });

    const grantMutation = useMutation({
        mutationFn: ({ userId, amount }: { userId: number; amount: number }) =>
            grantPixels(userId, amount),
        onSuccess: () => {
            setSelectedUser(null);
            setGrantAmount('');
            setSearchQuery('');
            store.trigger.fetchUser();
        },
    });

    const handleGrant = () => {
        if (!selectedUser || !grantAmount) return;

        const amount = parseInt(grantAmount, 10);
        if (isNaN(amount) || amount <= 0) return;

        grantMutation.mutate({
            userId: selectedUser.id,
            amount,
        });
    };

    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setSelectedUser(null);
            setGrantAmount('');
        }
    }, [isOpen]);

    if (!isAdmin) {
        return null;
    }

    return (
        <Popover
            type="persistent"
            modal={false}
            open={isOpen}
            onOpenChange={setIsOpen}
        >
            {children}
            <PopoverContent className="w-96">
                <PopoverHeading>Admin</PopoverHeading>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Search Users
                        </label>
                        <Input
                            type="text"
                            placeholder="Search by email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery.length > 0 && searchQuery.length < 2 && (
                            <p className="text-xs text-muted-foreground">
                                Type at least 2 characters to search
                            </p>
                        )}
                    </div>

                    {isSearching && (
                        <div className="text-sm text-muted-foreground">
                            Searching...
                        </div>
                    )}

                    {searchError && (
                        <div className="text-sm text-red-600">
                            {searchError instanceof Error
                                ? searchError.message
                                : 'Failed to search users'}
                        </div>
                    )}

                    {searchResults && searchResults.length > 0 && (
                        <div className="max-h-48 overflow-auto rounded border border-input">
                            {searchResults.map((user) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    className={cn(
                                        'w-full p-2 text-left hover:bg-secondary',
                                        selectedUser?.id === user.id &&
                                            'bg-secondary',
                                    )}
                                    onClick={() => setSelectedUser(user)}
                                >
                                    <div className="text-sm font-medium">
                                        {user.email}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Balance: {user.balance} pixels
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {searchResults && searchResults.length === 0 && (
                        <div className="text-sm text-muted-foreground">
                            No users found
                        </div>
                    )}

                    {selectedUser && (
                        <div className="space-y-2 border-t pt-4">
                            <div className="text-sm">
                                <div className="font-medium">
                                    Selected: {selectedUser.email}
                                </div>
                                <div className="text-muted-foreground">
                                    Current balance: {selectedUser.balance}{' '}
                                    pixels
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Grant Amount
                                </label>
                                <Input
                                    type="number"
                                    placeholder="Enter amount..."
                                    value={grantAmount}
                                    onChange={(e) =>
                                        setGrantAmount(e.target.value)
                                    }
                                    min="100"
                                    step="100"
                                />
                            </div>
                            <Button
                                onClick={handleGrant}
                                disabled={
                                    !grantAmount ||
                                    parseInt(grantAmount, 10) <= 0 ||
                                    grantMutation.isPending
                                }
                                className="w-full"
                            >
                                {grantMutation.isPending
                                    ? 'Granting...'
                                    : 'Grant Pixels'}
                            </Button>
                            {grantMutation.isError && (
                                <div className="text-sm text-red-600">
                                    {grantMutation.error instanceof Error
                                        ? grantMutation.error.message
                                        : 'Failed to grant pixels'}
                                </div>
                            )}
                            {grantMutation.isSuccess && (
                                <div className="text-sm text-green-600">
                                    {grantMutation.data.message}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
