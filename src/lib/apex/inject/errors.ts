export type InjectionErrorCode =
  | "unsupported_format"
  | "empty_source"
  | "unreadable"
  | "too_short";

export class InjectionError extends Error {
  readonly code: InjectionErrorCode;
  constructor(message: string, code: InjectionErrorCode) {
    super(message);
    this.name = "InjectionError";
    this.code = code;
  }
}
