export const GET = 'GET'
export const POST = 'POST'

export const CRLF = '\r\n'

export function finalizeHttpResponse(lines: string[]): string {
    return lines.join(CRLF) + CRLF + CRLF
}
