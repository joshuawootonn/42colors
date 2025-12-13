"use client";

import { motion, useSpring, useTransform } from "framer-motion";

import React from "react";
import { ComponentPropsWithoutRef, useEffect } from "react";

// ripped from https://buildui.com/recipes/animated-number

export const AnimatedNumber = React.forwardRef(function AnimatedNumber(
  { value }: { value: number } & ComponentPropsWithoutRef<typeof motion.span>,
  ref: React.ForwardedRef<HTMLSpanElement>,
) {
  const spring = useSpring(value, { mass: 0.1, stiffness: 150, damping: 10 });
  const display = useTransform(spring, (current) => Math.round(current).toLocaleString());

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span ref={ref}>{display}</motion.span>;
});
AnimatedNumber.displayName = "AnimatedNumber";
