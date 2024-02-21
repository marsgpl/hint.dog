import { request } from 'node:https'
import { createLog } from './createLog'
import { GET, POST } from './http'
import { OutgoingHttpHeaders } from 'node:http'

export interface TgBotApiConfig {
    token: string
}

export interface TgBotResponse {
    [key: string]: any
}

const log = createLog('TgBotApi')

type Method =
    | typeof GET
    | typeof POST

export class TgBotApi {
    constructor(protected config: TgBotApiConfig) {}

    public request(
        method: Method,
        endpoint: string,
        params?: Record<string, unknown>,
    ): Promise<TgBotResponse> {
        return new Promise((resolve, reject) => {
            const url = `https://api.telegram.org/bot${this.config.token}/${endpoint}`

            const body = method === POST
                ? String(new URLSearchParams(Object.entries(params || {})
                    .map(([key, value]) => [key, String(value)])))
                : ''

            const headers: OutgoingHttpHeaders = {}

            const options = {
                method,
                headers,
            }

            if (method === POST) {
                headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8'
                headers['Content-Length'] = body.length
            }

            log(method, endpoint)

            const req = request(url, options, res => {
                let response = ''

                res.on('data', data => {
                    response += String(data)
                })

                res.on('end', () => {
                    const json = JSON.parse(response)

                    if (!json.ok || !json.result) {
                        throw Error(`invalid response: ${response}`)
                    }

                    resolve(json.result)
                })

                res.on('error', reject)
            })

            req.on('error', reject)

            if (method === POST) {
                req.write(body)
            }

            req.end()
        })
    }

    public getMe() {
        return this.request(GET, 'getMe')
    }

    public getWebhookInfo() {
        return this.request(GET, 'getWebhookInfo')
    }

    public getUpdates() {
        return this.request(GET, 'getUpdates')
    }

    public setWebhook(url: string, secret: string) {
        return this.request(POST, 'setWebhook', {
            url,
            secret_token: secret,
        })
    }
}
