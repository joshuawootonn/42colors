/* eslint-disable @typescript-eslint/no-unsafe-function-type */

export function throttle(func: Function, delay: number): Function {
    let wait = false;

    return (...args: unknown[]) => {
        if (wait) {
            return;
        }

        func(...args);
        wait = true;
        setTimeout(() => {
            wait = false;
        }, delay);
    };
}
