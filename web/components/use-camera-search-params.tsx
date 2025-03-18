import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect } from "react";

export const useDebouncedEffect = (
  effect: (...args: unknown[]) => void,
  deps: unknown[],
  delay: number,
) => {
  useEffect(() => {
    const handler = setTimeout(() => effect(), delay);

    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...(deps || []), delay]);
};

export function useCameraSearchParams(x: number, y: number, zoom: number) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useDebouncedEffect(
    () => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("x", x.toString());
      params.set("y", y.toString());
      params.set("zoom", zoom.toString());

      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams, x, y, zoom],

    300,
  );
}
