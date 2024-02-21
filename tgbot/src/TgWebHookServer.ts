import { TgBotResponse } from './TgBotApi'
import { POST, finalizeHttpResponse } from './http'
import { IncomingMessage, Server, createServer } from 'node:http'
import { stringifyError } from './stringifyError'
import { createLog } from './createLog'

const log = createLog('TgWebHookServer')

export interface TgWebHookServerConfig {
    host: string
    port: number
    endpoint: string
    secret: string
    url: string
}

export class TgWebHookServer {
    protected server: Server

    constructor(
        protected config: TgWebHookServerConfig,
        protected onUpdate: (update: TgBotResponse) => Promise<void>
    ) {
        this.server = this.createServer()
    }

    protected processRequest(req: IncomingMessage): Promise<TgBotResponse> {
        return new Promise((resolve, reject) => {
            const { endpoint, secret: localSecret } = this.config
            const { method, url } = req

            log(method || 'no method', url || 'no url')

            if (url?.substring(0, endpoint.length) !== endpoint) {
                throw Error('endpoint mismatch')
            }

            if (method !== POST) {
                throw Error('method mismatch')
            }

            let body = ''

            req.on('error', reject)

            req.on('data', data => {
                body += String(data)
            })

            req.on('end', () => {
                try {
                    const json = JSON.parse(body)
                    const remoteSecret = String(req.headers['x-telegram-bot-api-secret-token'])

                    if (remoteSecret !== localSecret) {
                        throw Error('secret mismatch')
                    }

                    if (!json || typeof json !== 'object') {
                        throw Error(`parsed json is not an object`)
                    }

                    resolve(json)
                } catch (error) {
                    reject(error + '; body: ' + body + '; headers: ' + JSON.stringify(req.headers))
                }
            })
        })
    }

    protected createServer() {
        const server = createServer()

        server.on('clientError', (error, socket) => {
            socket.end(finalizeHttpResponse(['HTTP/1.1 400 Bad Request']))
            log('clientError:', stringifyError(error))
        })

        server.on('upgrade', (req, socket, head) => {
            socket.end(finalizeHttpResponse(['HTTP/1.1 501 Not Implemented']))
            log('upgrade:', 'rejecting')
        })

        server.on('dropRequest', (req, socket) => {
            socket.end(finalizeHttpResponse(['HTTP/1.1 503 Service Unavailable']))
            log('dropRequest')
        })

        server.on('error', error => {
            log('error:', stringifyError(error))
            throw error
        })

        server.on('request', (req, res) => {
            this.processRequest(req).then(update => {
                res.writeHead(200) // ok
                res.end()

                this.onUpdate(update).catch(error => {
                    log('request rejected:', stringifyError(error))
                })
            }).catch(error => {
                res.writeHead(400) // bad request
                res.end()
                log('request rejected:', stringifyError(error))
            })
        })

        return server
    }

    public listen(): Promise<true> {
        const { host, port, endpoint } = this.config

        return new Promise(resolve => {
            this.server.listen(port, host, () => {
                log(`ready on http://${host}:${port}${endpoint}`)
                resolve(true)
            })
        })
    }
}
