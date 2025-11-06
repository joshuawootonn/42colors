import { useEffect, useRef } from 'react';

export function useSoliDeoGloria() {
    const hasLogged = useRef(false);

    useEffect(() => {
        if (hasLogged.current) return;
        if (process.env.NODE_ENV !== 'production') return;

        hasLogged.current = true;
        console.log(`


    Soli Deo Gloria


    `);
    }, []);

    return null;
}
