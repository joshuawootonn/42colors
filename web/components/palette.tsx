import Color from "colorjs.io";
import { Variants, motion } from "motion/react";

import { ComponentPropsWithoutRef, useMemo } from "react";

import {
  COLOR_ORDER,
  COLOR_TABLE,
  ColorRef,
  V2_COLOR_ORDER,
  V2_COLOR_TABLE,
  V2ColorRef,
  mapV1ToV2ColorRef,
} from "@/lib/palette";
import { store } from "@/lib/store";
import { useNewPaletteEnabled } from "@/lib/use-new-palette";
import { cn } from "@/lib/utils";
import { chunk } from "@/lib/utils/chunk";
import { useSelector } from "@xstate/store/react";

function PaletteIconButton({
  color_ref,
  isForeground,
  isBackground,
  className,
  useNewPalette,
  ...props
}: ComponentPropsWithoutRef<typeof motion.button> & {
  isForeground: boolean;
  isBackground: boolean;
  color_ref: ColorRef | V2ColorRef;
  useNewPalette: boolean;
}) {
  const colorHex = useMemo(() => {
    if (useNewPalette) {
      return V2_COLOR_TABLE[color_ref as keyof typeof V2_COLOR_TABLE];
    }
    return COLOR_TABLE[color_ref as keyof typeof COLOR_TABLE];
  }, [color_ref, useNewPalette]);

  const colorString = useMemo(() => new Color(colorHex).to("lch").toString(), [colorHex]);
  const isLight = useMemo(() => new Color(colorHex).lch[0] > 50, [colorHex]);
  const hoveredColor = useMemo(() => {
    const hovered = new Color(colorHex);
    hovered.lch[0] = hovered.lch[0] + 10;
    return hovered.toString();
  }, [colorHex]);

  // Determine if this is a wide button (black or white)
  const isWideButton = useNewPalette
    ? color_ref === 1 || color_ref === 5 // V2: white=1, black=5
    : color_ref === 1 || color_ref === 2; // V1: black=1, white=2

  return (
    <motion.button
      {...props}
      className={cn(
        "border-1 group relative flex size-8 items-center justify-center border-border bg-white text-white ring-[1.5px] ring-black",
        "rounded-none outline-none focus-visible:border-border",
        isWideButton && "w-16",
        className,
      )}
      initial={{ backgroundColor: colorString }}
      transition={{ duration: 0 }}
      whileHover={{ backgroundColor: hoveredColor }}
    >
      {isForeground && (
        <svg
          className="absolute -left-[0.5px] -top-[0.5px]"
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

      {isBackground && (
        <svg
          className="absolute -bottom-[0.5px] -right-[0.5px]"
          width="13"
          height="13"
          viewBox="0 0 13 13"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 12L12 1V12H1Z"
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
  const state = useSelector(store, (state) => state.context.state);
  const foregroundColor = useSelector(
    store,
    (state) => state.context.toolSettings.palette.foregroundColorRef,
  );
  const backgroundColor = useSelector(
    store,
    (state) => state.context.toolSettings.palette.backgroundColorRef,
  );
  const useNewPalette = useNewPaletteEnabled();

  if (state !== "initialized") return null;

  // When using new palette, map v1 refs to v2 for comparison
  const colorOrder = useNewPalette ? V2_COLOR_ORDER : COLOR_ORDER;
  const mappedForegroundColor = useNewPalette
    ? mapV1ToV2ColorRef(foregroundColor)
    : foregroundColor;
  const mappedBackgroundColor = useNewPalette
    ? mapV1ToV2ColorRef(backgroundColor)
    : backgroundColor;

  return (
    <div className="flex flex-row justify-end">
      <motion.div
        className={cn("flex flex-col p-0.5")}
        variants={container}
        initial="show"
        animate={"show"}
      >
        {chunk(colorOrder, 4).map((colorChunk, i) => (
          <motion.div variants={row} key={i} className="flex flex-row">
            {colorChunk.map((color_ref) => (
              <PaletteIconButton
                onClick={() => {
                  store.trigger.updatePaletteSettings({
                    palette: {
                      foregroundColorRef: color_ref as ColorRef,
                    },
                  });
                }}
                onContextMenu={(e) => {
                  // Prevent default context menu from appearing
                  e.preventDefault();
                  store.trigger.updatePaletteSettings({
                    palette: {
                      backgroundColorRef: color_ref as ColorRef,
                    },
                  });
                }}
                key={color_ref}
                color_ref={color_ref}
                useNewPalette={useNewPalette}
                isForeground={mappedForegroundColor === color_ref}
                isBackground={mappedBackgroundColor === color_ref}
                variants={item}
              />
            ))}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
