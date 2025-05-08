import Color from "colorjs.io";
import { cn } from "@/lib/utils";
import {
  ComponentPropsWithoutRef,
  useCallback,
  useMemo,
  useState,
} from "react";
import { motion } from "motion/react";
import { store } from "@/lib/store";
import { useSelector } from "@xstate/store/react";
import { COLOR_ORDER, ColorRef, COLOR_TABLE } from "@/lib/palette";

export function IconButton({
  colorRef,
  showCurrentColorIndicator,
  ...props
}: ComponentPropsWithoutRef<typeof motion.button> & {
  showCurrentColorIndicator: boolean;
  colorRef: ColorRef;
}) {
  const currentColor = useSelector(
    store,
    (state) => state.context.currentColorRef,
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
        "group flex justify-center items-center bg-white text-white size-8 border-1.5 border-black ring-1 ring-black",
        "relative",
        "focus-visible:border-black outline-none rounded-none",
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

export function Palette() {
  const [isOpen, setIsOpen] = useState(false);

  const currentColor = useSelector(
    store,
    (state) => state.context.currentColorRef as ColorRef,
  );

  return (
    <div className="flex flex-row justify-end">
      {isOpen ? (
        <div
          className={cn("p-0.5 grid grid-cols-[repeat(12,_minmax(0,_1fr))]")}
        >
          {COLOR_ORDER.map((colorRef) => (
            <IconButton
              onClick={() => {
                setIsOpen(false);
                store.trigger.setCurrentColor({ colorRef });
              }}
              key={colorRef}
              colorRef={colorRef}
              showCurrentColorIndicator={true}
            />
          ))}
        </div>
      ) : (
        <div className={cn("p-0.5")}>
          <IconButton
            onClick={() => setIsOpen(true)}
            showCurrentColorIndicator={false}
            colorRef={currentColor}
          />
        </div>
      )}
    </div>
  );
}
