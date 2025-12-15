import { useId } from "react";

import { NumberField as BaseNumberField } from "@base-ui/react/number-field";

import { cn } from "@/lib/utils";

function PlusIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M0 5H5M10 5H5M5 5V0M5 5V10" />
    </svg>
  );
}

function MinusIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M0 5H10" />
    </svg>
  );
}

interface NumberFieldProps {
  label?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onValueChange: (value: number | null) => void;
  className?: string;
}

function countCommas(num: number): number {
  const digits = String(Math.abs(num)).length;
  return Math.floor((digits - 1) / 3);
}

function getInputWidth(min: number, max: number): string {
  const minLength = String(min).length + countCommas(min);
  const maxLength = String(max).length + countCommas(max);
  // Add 2ch padding for comfort
  return `${Math.max(minLength, maxLength) + 2}ch`;
}

export function NumberField({
  label,
  value,
  min,
  max,
  step,
  onValueChange,
  className,
}: NumberFieldProps) {
  const id = useId();
  const inputWidth = getInputWidth(min, max);

  return (
    <BaseNumberField.Root
      id={id}
      value={value}
      min={min}
      max={max}
      step={step}
      largeStep={step * 10}
      onValueChange={onValueChange}
      className={cn("flex flex-row items-center", className)}
    >
      {label && (
        <BaseNumberField.ScrubArea className="!cursor-ew-resize border-[1.5px] border-r-0 border-primary bg-background px-2 h-[30px]">
          <label
            htmlFor={id}
            className="text-sm text-primary leading-[28px] select-none block !cursor-ew-resize"
          >
            {label}
          </label>
        </BaseNumberField.ScrubArea>
      )}

      <BaseNumberField.Group className="flex items-center">
        <BaseNumberField.Decrement className="flex h-7.5 w-7 items-center justify-center border-[1.5px] border-r-0 border-primary bg-white hover:bg-black hover:text-white active:bg-black active:text-white">
          <MinusIcon />
        </BaseNumberField.Decrement>
        <BaseNumberField.Input
          style={{ width: inputWidth }}
          className={cn(
            "flex h-7.5 border-[1.5px] border-input bg-white text-center text-sm outline-none",
            "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          )}
        />
        <BaseNumberField.Increment className="flex h-7.5 w-7 items-center justify-center border-[1.5px] border-l-0 border-primary bg-white hover:bg-black hover:text-white active:bg-black active:text-white">
          <PlusIcon />
        </BaseNumberField.Increment>
      </BaseNumberField.Group>
    </BaseNumberField.Root>
  );
}
