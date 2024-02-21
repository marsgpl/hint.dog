import { readFile } from 'node:fs/promises'
import { BotConfig } from './config'
import { createLog } from './createLog'

const log = createLog('Config')

export async function readConfig(path: string): Promise<BotConfig> {
    const text = await readFile(path, {
        encoding: 'utf-8',
    })

    const json = JSON.parse(text)

    log('OK')

    return json
}
