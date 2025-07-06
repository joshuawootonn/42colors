'use client';

import {
    ComponentPropsWithRef,
    ComponentPropsWithoutRef,
    ElementType,
} from 'react';

import { DialogTitle, useIsWithinDialogContext } from './ui/dialog';

function withElement<T extends ElementType>(Element: T) {
    return function Component(props: ComponentPropsWithRef<T>) {
        return <Element {...props} />;
    };
}

export function H1(props: ComponentPropsWithoutRef<'h1'>) {
    const isDialog = useIsWithinDialogContext();
    const Element = isDialog ? DialogTitle : withElement('h1');
    return <Element {...props} />;
}

export function H2(props: ComponentPropsWithoutRef<'h2'>) {
    const isDialog = useIsWithinDialogContext();
    const Element = isDialog ? withElement('h3') : withElement('h2');
    return <Element {...props} />;
}
