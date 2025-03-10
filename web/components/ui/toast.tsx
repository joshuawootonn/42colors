"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, toast as sonnerToast } from "sonner";
import { Button } from "./button";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      {...props}
    />
  );
};

/** I recommend abstracting the toast function
 *  so that you can call it without having to use toast.custom everytime. */
function _toast(toast: Omit<ToastProps, "id">) {
  return sonnerToast.custom((id) => (
    <Toast
      id={id}
      title={toast.title}
      description={toast.description}
      button={toast.button}
    />
  ));
}

const throttledKeys: string[] = [];

export function throttleByKey<T extends Omit<ToastProps, "id">>(
  callback: (p: T) => void,
) {
  return function (params: T) {
    if (throttledKeys.indexOf(params.title) === -1) {
      callback(params);
      throttledKeys.push(params.title);
      setTimeout(function () {
        const index = throttledKeys.indexOf(params.title);
        if (index > -1) throttledKeys.splice(index, 1);
      }, 5000);
    }
  };
}

const toast = throttleByKey(_toast);

export function Toast(props: ToastProps) {
  const { title, description, button, id } = props;

  return (
    <div className="font-sans flex bg-secondary shadow-lg border-1.5 border-primary w-full md:max-w-96 items-center p-4">
      <div className="flex flex-1 items-center">
        <div className="w-full">
          <p className="text-sm text-primary">{title}</p>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <div className="ml-4 shrink-0">
        {button && (
          <Button
            size="sm"
            onClick={() => {
              button.onClick();
              sonnerToast.dismiss(id);
            }}
          >
            {button.label}
          </Button>
        )}
      </div>
    </div>
  );
}

interface ToastProps {
  id: string | number;
  title: string;
  description: string;
  button?: {
    label: string;
    onClick: () => void;
  };
}

export { Toaster, toast };
