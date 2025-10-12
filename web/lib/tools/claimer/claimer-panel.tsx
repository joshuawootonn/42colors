import { X } from '@/components/icons/x';
import { IconButton } from '@/components/ui/icon-button';
import { useSelector } from '@xstate/store/react';

import { store } from '../../store';
import { CreatePlotForm } from './create-plot-form';

export function ClaimerPanel() {
    const activeAction = useSelector(
        store,
        (state) => state.context.activeAction,
    );

    const user = useSelector(store, (state) => state.context?.user);

    if (user == null) return null;

    return (
        <div className="flex">
            {activeAction?.type === 'claimer-active' ? (
                <>
                    <CreatePlotForm />
                    <IconButton
                        className="text-black"
                        onClick={() => {
                            store.trigger.clearClaim();
                        }}
                    >
                        <X />
                    </IconButton>
                </>
            ) : null}
        </div>
    );
}
