import Color from 'colorjs.io';
import { Variants, motion } from 'motion/react';

import { ComponentPropsWithoutRef, useMemo } from 'react';

import { COLOR_ORDER, COLOR_TABLE, ColorRef } from '@/lib/palette';
import { store } from '@/lib/store';
import { cn } from '@/lib/utils';
import { chunk } from '@/lib/utils/chunk';
import { useSelector } from '@xstate/store/react';

function IconButton({
    colorRef,
    isForeground,
    isBackground,
    className,
    ...props
}: ComponentPropsWithoutRef<typeof motion.button> & {
    isForeground: boolean;
    isBackground: boolean;
    colorRef: ColorRef;
}) {
    const colorString = useMemo(
        () => new Color(COLOR_TABLE[colorRef]).to('lch').toString(),
        [colorRef],
    );
    const isLight = useMemo(
        () => new Color(COLOR_TABLE[colorRef]).lch[0] > 50,
        [colorRef],
    );
    const hoveredColor = useMemo(() => {
        const hoveredColor = new Color(COLOR_TABLE[colorRef]);

        hoveredColor.lch[0] = hoveredColor.lch[0] + 10;

        return hoveredColor.toString();
    }, [colorRef]);

    return (
        <motion.button
            {...props}
            className={cn(
                'border-1 group relative flex size-8 items-center justify-center border-black bg-white text-white ring-2 ring-black',
                'rounded-none outline-none focus-visible:border-black',
                className,
            )}
            initial={{ backgroundColor: colorString }}
            transition={{ duration: 0 }}
            whileHover={{ backgroundColor: hoveredColor }}
        >
            {isForeground && (
                <svg
                    className="absolute -left-[1px] -top-[1px]"
                    width="19"
                    height="19"
                    viewBox="0 0 19 19"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M17 1L1 17V1H17Z"
                        fill={isLight ? 'black' : 'white'}
                        stroke={isLight ? 'black' : 'white'}
                    />
                </svg>
            )}

            {isBackground && (
                <svg
                    className="absolute -bottom-[1px] -right-[1px]"
                    width="13"
                    height="13"
                    viewBox="0 0 13 13"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M1 12L12 1V12H1Z"
                        fill={isLight ? 'black' : 'white'}
                        stroke={isLight ? 'black' : 'white'}
                    />
                </svg>
            )}
        </motion.button>
    );
}
const container: Variants = {
    hidden: {
        transition: {
            duration: 0,
            staggerChildren: 0.02,
            staggerDirection: -1,
        },
    },
    show: {
        transition: {
            duration: 0,
            staggerChildren: 0.02,
        },
    },
};

const row: Variants = {
    hidden: {
        display: 'none',
        transition: {
            duration: 0,
            staggerChildren: 0.01,
            staggerDirection: -1,
        },
    },
    show: {
        display: 'flex',
        transition: {
            duration: 0,
            staggerChildren: 0.01,
        },
    },
};

const item: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1 },
};

export function Palette() {
    const state = useSelector(store, (state) => state.context.state);
    const foregroundColor = useSelector(
        store,
        (state) => state.context.toolSettings.palette.foregroundColorRef,
    );
    const backgroundColor = useSelector(
        store,
        (state) => state.context.toolSettings.palette.backgroundColorRef,
    );

    if (state !== 'initialized') return null;

    return (
        <div className="flex flex-row justify-end">
            <motion.div
                className={cn('flex flex-col p-0.5')}
                variants={container}
                initial="show"
                animate={'show'}
            >
                <div></div>
                {chunk(COLOR_ORDER, 4).map((colorChunk, i) => (
                    <motion.div
                        variants={row}
                        key={i}
                        className="flex flex-row"
                    >
                        {colorChunk.map((colorRef) => (
                            <IconButton
                                onClick={(e) => {
                                    console.log(e.button);
                                    store.trigger.updatePaletteSettings({
                                        palette: {
                                            foregroundColorRef: colorRef,
                                        },
                                    });
                                }}
                                onContextMenu={(e) => {
                                    // Prevent default context menu from appearing
                                    e.preventDefault();
                                    store.trigger.updatePaletteSettings({
                                        palette: {
                                            backgroundColorRef: colorRef,
                                        },
                                    });
                                }}
                                key={colorRef}
                                colorRef={colorRef}
                                isForeground={foregroundColor === colorRef}
                                isBackground={backgroundColor === colorRef}
                                variants={item}
                            />
                        ))}
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}
