import Color from "colorjs.io";
import { cn } from "@/lib/utils";
import { ComponentPropsWithoutRef, useMemo, useState } from "react";
import { motion, Variants } from "motion/react";
import { store } from "@/lib/store";
import { useSelector } from "@xstate/store/react";
import { COLOR_ORDER, ColorRef, COLOR_TABLE } from "@/lib/palette";
import { chunk } from "@/lib/utils/chunk";
import { ToolIconButton } from "./toolbar";

export function IconButton({
  colorRef,
  showCurrentColorIndicator,
  className,
  ...props
}: ComponentPropsWithoutRef<typeof motion.button> & {
  showCurrentColorIndicator: boolean;
  colorRef: ColorRef;
}) {
  const currentColor = useSelector(
    store,
    (state) => state.context.toolSettings.palette.currentColorRef,
  );
  const colorString = useMemo(
    () => new Color(COLOR_TABLE[colorRef]).to("lch").toString(),
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
        "relative group flex justify-center items-center bg-white text-white size-8 border-1.5 border-black ring-1 ring-black",
        "focus-visible:border-black outline-none rounded-none",
        className,
      )}
      initial={{ backgroundColor: colorString }}
      transition={{ duration: 0 }}
      whileHover={{ backgroundColor: hoveredColor }}
    >
      {currentColor === colorRef && showCurrentColorIndicator && (
        <svg
          className="absolute -top-[1px] -left-[1px]"
          width="19"
          height="19"
          viewBox="0 0 19 19"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17 1L1 17V1H17Z"
            fill={isLight ? "black" : "white"}
            stroke={isLight ? "black" : "white"}
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
    display: "none",
    transition: {
      duration: 0,
      staggerChildren: 0.01,
      staggerDirection: -1,
    },
  },
  show: {
    display: "flex",
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
  const isOpen = useSelector(
    store,
    (state) => state.context.toolSettings.palette.isOpen,
  );
  const currentColor = useSelector(
    store,
    (state) => state.context.toolSettings.palette.currentColorRef,
  );

  return (
    <div className="flex flex-row justify-end">
      <motion.div
        className={cn("p-0.5 flex flex-col")}
        variants={container}
        initial="show"
        animate={isOpen ? "show" : "hidden"}
      >
        <div>
          <ToolIconButton
            key={currentColor}
            onClick={() =>
              store.trigger.updatePaletteSettings({
                palette: { isOpen: !isOpen },
              })
            }
            active={false}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"
                className="stroke-primary"
              />
              <g className="stroke-primary">
                <circle cx="13.5" cy="6.5" r=".5" />
                <circle cx="17.5" cy="10.5" r=".5" />
                <circle cx="6.5" cy="12.5" r=".5" />
                <circle cx="8.5" cy="7.5" r=".5" />
              </g>
            </svg>
          </ToolIconButton>
        </div>
        {chunk(COLOR_ORDER, 4).map((colorChunk, i) => (
          <motion.div variants={row} key={i} className="flex flex-row">
            {colorChunk.map((colorRef) => (
              <IconButton
                onClick={() =>
                  store.trigger.updatePaletteSettings({
                    palette: {
                      currentColorRef: colorRef,
                    },
                  })
                }
                key={colorRef}
                colorRef={colorRef}
                showCurrentColorIndicator={true}
                variants={item}
              />
            ))}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
