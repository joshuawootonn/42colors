import { useEffect, useState } from 'react';

// this is not replacable by react-use...
// there's is fricked
export function useKeyPress(targetKey: string) {
    const [isKeyPressed, setIsKeyPressed] = useState(false);
    function handleKeyDown({ code }: KeyboardEvent) {
        if (code === targetKey) {
            setIsKeyPressed(true);
        }
    }
    const handleKeyUp = ({ code }: KeyboardEvent) => {
        if (code === targetKey) {
            setIsKeyPressed(false);
        }
    };
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        // Remove event listeners on cleanup
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);
    return isKeyPressed;
}
