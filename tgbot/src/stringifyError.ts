export function stringifyError(error: unknown): string {
    if (error instanceof Error) {
        return String(error.message)
    }

    if (error && typeof error === 'object') {
        return JSON.stringify(error, Object.getOwnPropertyNames(error))
    }

    return String(error)
}
