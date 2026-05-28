import { useMemo } from "react";
import type { UseEditMode } from "../../hooks/useEditMode";

const CURSOR_ERASE = "cursorErase";
const CURSOR_PLACE = "cursorPlace";
const CURSOR_GRAB = "cursorGrab";
const CURSOR_DEFAULT = "cursorDefault";

interface UseCursorStyleArgs {
  edit: UseEditMode;
  editDragSource: string | null;
}

export function useCursorStyle({
  edit,
  editDragSource,
}: UseCursorStyleArgs): string {
  return useMemo(() => {
    if (!edit.isEditMode) return "";
    if (edit.isErasing) return CURSOR_ERASE;
    if (edit.selectedPalettePiece) return CURSOR_PLACE;
    if (editDragSource) return CURSOR_GRAB;
    return CURSOR_DEFAULT;
  }, [
    edit.isEditMode,
    edit.isErasing,
    edit.selectedPalettePiece,
    editDragSource,
  ]);
}