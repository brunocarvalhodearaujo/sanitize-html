declare module 'parse-srcset' {
  function parseSrcset(input: string): Array<{ url: string, w?: number, h?: number, d?: number }>
  export default parseSrcset
}

declare module 'launder' {
  export function naughtyHref(
    href: unknown,
    options?: { allowedSchemes?: string[], allowProtocolRelative?: boolean }
  ): boolean
}
