import Color from "colorjs.io";
import { cn } from "@/lib/utils";
import { ComponentPropsWithoutRef, useCallback, useMemo } from "react";
import { motion } from "motion/react"
import { store } from "@/lib/store";
import { useSelector } from "@xstate/store/react";

export function IconButton({
  children,
  value,
  ...props
}: ComponentPropsWithoutRef<typeof motion.button> & {  value: string  }) {

  const currentColor = useSelector(store, (state) => state.context.currentColor);
  const setCurrentColor = useCallback(() => store.trigger.setCurrentColor({ color: value }), [value]);
  const color = useMemo(() => new Color(value).to('lch').toString(), [value]);
  const isLight = useMemo(() => new Color(color).lch[0] > 50, [value]);
  const hoveredColor = useMemo(() => {
      const hoveredColor = new Color(color)
      
      hoveredColor.lch[0] = hoveredColor.lch[0] + 10
      
      return hoveredColor.toString()
  }, [value]);

  return (
    <motion.button
      {...props}
      className={cn(
        "group flex justify-center items-center bg-white text-white size-8 border-1.5 border-black ring-1 ring-black",
        "relative",
        "focus-visible:border-black outline-none rounded-none",
      )}
      initial={{ backgroundColor: color }}
      transition={{ duration: 0 }}
      whileHover={{ backgroundColor: hoveredColor }}
      onClick={setCurrentColor}
    >
      {currentColor === value && (
        <svg
          className="absolute -top-[1px] -left-[1px]"
          width="19"
          height="19"
          viewBox="0 0 19 19"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17 1L1 17V1H17Z" fill={isLight ? "black" : "white"} stroke={isLight ? "black" : "white"} />
        </svg>
      )}
    </motion.button>
  );
}

export function Palette() {

  return (
    <div className="flex flex-row justify-end">
      <div className={cn("p-0.5 grid grid-cols-[repeat(12,_minmax(0,_1fr))]")}>
        <IconButton value="#b7c4cc"  />
        <IconButton value="#7a7c8a"  />
        <IconButton value="#3d3a4a"  />
        <IconButton value="#171622"  />
        <IconButton value="#ccbfab"  />
        <IconButton value="#8a716f"  />
        <IconButton value="#4a333d"  />
        <IconButton value="#221524"  />
        <IconButton value="#dda980"  />
        <IconButton value="#a4644a"  />
        <IconButton value="#60302c"  />
        <IconButton value="#301117"  />
        <IconButton value="#ff947d"  />
        <IconButton value="#f23722"  />
        <IconButton value="#8c1d32"  />
        <IconButton value="#3c0b22"  />
        <IconButton value="#ffb45f"  />
        <IconButton value="#f36f1c"  />
        <IconButton value="#87381d"  />
        <IconButton value="#3d1212"  />
        <IconButton value="#f6f04a"  />
        <IconButton value="#cead19"  />
        <IconButton value="#6f5922"  />
        <IconButton value="#39230f"  />
        <IconButton value="#a0ff78"  />
        <IconButton value="#3ecb2b"  />
        <IconButton value="#1a6636"  />
        <IconButton value="#062622"  />
        <IconButton value="#84eeff"  />
        <IconButton value="#299be2"  />
        <IconButton value="#274fa2"  />
        <IconButton value="#0f1b4d"  />
        <IconButton value="#ff98fc"  />
        <IconButton value="#bc2fe3"  />
        <IconButton value="#5e198e"  />
        <IconButton value="#231047"  />
        <IconButton value="#ff9494"  />
        <IconButton value="#f11985"  />
        <IconButton value="#88126f"  />
        <IconButton value="#3f0d43"  />
        <IconButton value="#000000"  />
        <IconButton value="#ffffff"  />
      </div>
    </div>
  );
}
