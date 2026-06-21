// Type shim for mammoth's pre-built browser bundle.
// The browser build exposes the same API surface as the main package.
declare module "mammoth/mammoth.browser.min.js" {
  interface ConversionResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }

  export function extractRawText(input: {
    arrayBuffer: ArrayBuffer;
  }): Promise<ConversionResult>;

  export function convertToHtml(input: {
    arrayBuffer: ArrayBuffer;
  }): Promise<ConversionResult>;
}
