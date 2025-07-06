import * as React from 'react';

import { cn } from '@/lib/utils';

import styles from './number-input.module.css';

function NumberInputButton({
    className,
    onHold,
    ...props
}: React.ComponentPropsWithoutRef<'button'> & { onHold: () => void }) {
    const timerID = React.useRef<number | null>(null);
    const counter = React.useRef(0);

    const pressHoldDuration = 20;

    function pressingDown(e: React.PointerEvent | React.TouchEvent) {
        requestAnimationFrame(timer);
        e.preventDefault();
    }

    function notPressingDown() {
        if (timerID.current != null) cancelAnimationFrame(timerID.current);
        counter.current = 0;
    }

    function timer() {
        if (counter.current < pressHoldDuration) {
            timerID.current = requestAnimationFrame(timer);
            counter.current++;
        } else if (counter.current === pressHoldDuration) {
            timerID.current = requestAnimationFrame(timer);
            onHold();
        }
    }

    return (
        <button
            tabIndex={-10}
            className={cn(
                'flex justify-center items-center h-1/2 aspect-square',
                className,
            )}
            onPointerDown={pressingDown}
            onTouchStart={pressingDown}
            onPointerUp={notPressingDown}
            onPointerLeave={notPressingDown}
            onTouchEnd={notPressingDown}
            {...props}
        />
    );
}

function valueToWidth(value: number | string) {
    return `${String(value).length.toString()}ch`;
}

const NumberInput = React.forwardRef<
    HTMLInputElement,
    Omit<React.ComponentProps<'input'>, 'type' | 'step' | 'min' | 'max'> & {
        step: number;
        min: number;
        max: number;
    }
>(({ className, value, ...props }, parentRef) => {
    if (typeof value !== 'number') {
        throw new Error("Number Input value must be type 'number'");
    }

    const buttonRef = React.useRef<HTMLInputElement | null>(null);

    const onStep = React.useCallback(
        (step: number) => {
            buttonRef.current?.focus();

            const next = parseInt(buttonRef.current!.value) + step;

            if (next >= props.max) {
                props.onChange?.({
                    currentTarget: {
                        name: props.name,
                        value: `${props.max}`,
                    },
                } as React.ChangeEvent<HTMLInputElement>);
                return;
            }

            if (next <= props.min) {
                props.onChange?.({
                    currentTarget: {
                        name: props.name,
                        value: `${props.min}`,
                    },
                } as React.ChangeEvent<HTMLInputElement>);
                return;
            }

            props.onChange?.({
                currentTarget: {
                    name: props.name,
                    value: `${parseInt(buttonRef.current!.value) + step}`,
                },
            } as React.ChangeEvent<HTMLInputElement>);
        },
        [props],
    );

    const visualValue = Math.trunc(value);

    return (
        <div
            className={cn(
                'relative z-0 svg-outline-within-sm  bg-white',
                className,
            )}
        >
            <input
                ref={(ref) => {
                    if (typeof parentRef === 'function') parentRef(ref);
                    else if (parentRef !== null) parentRef.current = ref;
                    buttonRef.current = ref;
                }}
                type="number"
                className={cn(
                    styles.input,
                    'flex h-7.5 min-w-0 border-[1.5px] border-input bg-transparent text-base',
                    'w-[calc(var(--number-input-width)+30px)]',
                    '[input\[type=number\]::-webkit-outer-spin-button]:appearance-[textfield]',
                    'pl-1',
                    'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
                    'placeholder:text-muted-foreground outline-none',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                )}
                onInput={(e) => props.onInput?.(e)}
                value={visualValue}
                style={
                    {
                        '--number-input-width': valueToWidth(visualValue),
                    } as React.CSSProperties
                }
                {...props}
            />
            <div className="absolute right-[1.5px] divide-y-1.5 divide-primary top-0 h-full z-10 flex flex-col border-l-primary border-l-1.5">
                <NumberInputButton
                    className="group hover:bg-black"
                    value={value}
                    onClick={() => onStep(props.step)}
                    onHold={() => onStep(props.step)}
                >
                    <svg
                        width="6"
                        height="6"
                        viewBox="0 0 6 6"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-black group-hover:text-white translate-y-[1px]"
                    >
                        <path
                            d="M0.994293 3.75L3.04978 2.25L5.0057 3.75"
                            stroke="currentColor"
                            strokeWidth="1.5"
                        />
                    </svg>
                </NumberInputButton>

                <NumberInputButton
                    className="group hover:bg-black"
                    onClick={() => onStep(props.step * -1)}
                    onHold={() => onStep(props.step * -1)}
                >
                    <svg
                        width="6"
                        height="6"
                        viewBox="0 0 6 6"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-black group-hover:text-white translate-y-[-1px]"
                    >
                        <path
                            d="M0.994293 2.16843L3.04978 3.83156L5.0057 2.16843"
                            stroke="currentColor"
                            strokeWidth="1.5"
                        />
                    </svg>
                </NumberInputButton>
            </div>
        </div>
    );
});
NumberInput.displayName = 'NumberInput';

export { NumberInput };
