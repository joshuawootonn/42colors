import { toast } from "@/components/ui/toast";
import { ErrorCode } from "./error-codes";
import { Pixel } from "./geometry/coord";
import { InitializedStore } from "./store";
import { isInitialStore } from "./utils/is-initial-store";

export function newPixels(context: InitializedStore, pixels: Pixel[]) {
  if (isInitialStore(context)) return;
  const authURL = context.server.authURL;

  if (context.server.channel == null || pixels.length === 0) return;

  context.server.channel
    .push("new_pixels", {
      pixels: pixels.map((pixel) => ({
        ...pixel,
        color: pixel.colorRef,
      })),
      store_id: context.id,
    })
    .receive("error", (resp) => {
      if (resp === ErrorCode.UNAUTHED_USER) {
        toast({
          title: "Login (when you are ready)",
          description: "to save and share your pixels.",
          button: authURL
            ? {
                label: "login",
                onClick: () => {
                  window.location.href = authURL;
                },
              }
            : undefined,
        });
      }
    });
}
