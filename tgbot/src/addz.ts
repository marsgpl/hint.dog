export function addz(number: number, needLength = 2): string {
    let result = String(number)

    while (result.length < needLength) {
        result = '0' + result
    }

    return result
}
