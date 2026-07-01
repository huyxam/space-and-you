import { createContext, useContext } from "react";

export const ImageSelectionContext = createContext(null);

export function useImageSelection() {
  const context = useContext(ImageSelectionContext);
  if (!context) {
    throw new Error("useImageSelection must be used within an ImageSelectionContext provider.");
  }
  return context;
}
