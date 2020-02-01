import React from 'react';

const useAnimationFrame = callback => {
    // Use useRef for mutable variables that we want to persist
    // without triggering a re-render on their change
    const requestRef = React.useRef();
    const previousTimeRef = React.useRef();

    const animate = time => {
        if (previousTimeRef.current != undefined) {
            callback();
        }
        previousTimeRef.current = time;

        requestRef.current = window.requestAnimationFrame(animate);
    };

    React.useEffect(() => {
        requestRef.current = window.requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, []); // Make sure the effect runs only once
};

export default useAnimationFrame();
