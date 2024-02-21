import { MongoClient } from 'mongodb'
import { createLog } from './createLog'
import { TgBotApi } from './TgBotApi'
import { readConfig } from './readConfig'
import { TgWebHookServer } from './TgWebHookServer'
import { onUpdate } from './onUpdate'
import { States } from './services/States'
import { Hints } from './services/Hints'
import { TgUsers } from './services/TgUsers'

export interface Services {
    states: States
    hints: Hints
    tgUsers: TgUsers
}

const log = createLog()

const configPath = process.env.CONFIG_PATH

if (!configPath) {
    throw Error('CONFIG_PATH env is missing')
}

(async () => {
    const config = await readConfig(configPath)

    const mongo = new MongoClient(config.mongo.url)

    await mongo.connect()

    log('Mongo: OK')

    const services: Services = {
        states: new States(mongo, 'states'),
        hints: new Hints(mongo, 'hints'),
        tgUsers: new TgUsers(mongo, 'tg_users'),
    }

    await services.states.getLastUpdateId()

    const api = new TgBotApi(config.botApi)

    const server = new TgWebHookServer(
        config.webHookServer,
        update => onUpdate(api, services, update))

    await server.listen()

    const me = await api.getMe()
    log(`bot info: ${JSON.stringify(me)}`)

    const hookInfo = await api.getWebhookInfo()
    log(`prev hook: ${JSON.stringify(hookInfo)}`)

    await api.setWebhook(
        config.webHookServer.url,
        config.webHookServer.secret)
})()
