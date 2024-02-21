import { addz } from './addz'

const MONTH = [
    'Jan', 'Feb', 'Mar', 'Apr',
    'May', 'Jun', 'Jul', 'Aug',
    'Sep', 'Oct', 'Nov', 'Dec',
]

const SEP = '    '

function printLog(from: string | undefined, msg: string) {
    const date = new Date()

    const y = date.getFullYear()
    const m = MONTH[date.getMonth()]
    const d = date.getDate()
    const H = date.getHours()
    const M = date.getMinutes()
    const S = date.getSeconds()
    const MS = date.getMilliseconds()

    const ts = `${y} ${m} ${d} ${addz(H)}:${addz(M)}:${addz(S)} ${addz(MS, 3)}`

    console.log(ts + SEP + (from ? from + ': ' : '') + msg)
}

export function createLog(from?: string) {
    return (...msgs: (string | number)[]) =>
        printLog(from, msgs.map(String).join(' '))
}
