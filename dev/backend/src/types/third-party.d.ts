declare module "csv-parser" {
  import type { Transform } from "stream";

  type CsvParserOptions = {
    headers?: boolean | string[];
    separator?: string;
    newline?: string;
    quote?: string;
    escape?: string;
    strict?: boolean;
    skipLines?: number;
    skipComments?: boolean;
    maxRowBytes?: number;
    mapHeaders?: (args: { header: string; index: number }) => string | null;
    mapValues?: (args: { header: string; index: number; value: any }) => any;
  };

  function csvParser(options?: CsvParserOptions): Transform;
  export default csvParser;
}

declare module "json2csv" {
  export type Json2CsvOptions = {
    fields?: string[];
    delimiter?: string;
    quote?: string;
    escapedQuote?: string;
    header?: boolean;
    withBOM?: boolean;
  };

  export function parse(data: any[], opts?: Json2CsvOptions): string;
}
