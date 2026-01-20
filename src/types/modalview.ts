type ModalKind = "error" | "warning" | "info" | "success";
export type ModalState = {
  open: boolean;
  title: string;
  message: string;
  kind: ModalKind;
};