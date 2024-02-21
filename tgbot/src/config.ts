import { TgBotApiConfig } from './TgBotApi'
import { TgWebHookServerConfig } from './TgWebHookServer'

export interface BotConfig {
    mongo: {
        url: string
    }
    botApi: TgBotApiConfig
    webHookServer: TgWebHookServerConfig
}
