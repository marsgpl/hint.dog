import { Services } from 'src'
import { TgBotApi, TgBotResponse } from './TgBotApi'
import {
    TgUser,
    TG_USER_STATUS_DEFAULT,
    TG_USER_STATUS_WAIT_FOR_HINT_INPUT,
} from './models/TgUser'
import { POST } from './http'

const REPLY_OUT_OF_HINTS = 'У меня кончились советы🐶'
const REPLY_SEND_ME_YOUR_HINT = 'Отправь мне свой совет текстом:'
const REPLY_OK = 'Хорошо'
const REPLY_HINT_ACCEPTED = 'Спасибо за совет!'
const PLACEHOLDER_SELECT_ACTION = 'Выбери действие'
const PLACEHOLDER_HINT_EXAMPLE = 'Пример: сделал дело - гуляй смело'
const ACTION_GIVE_ME_HINT = 'Посоветуй что-нибудь'
const ACTION_I_WANT_TO_GIVE_HINT = '💡 Я хочу дать совет'
const ACTION_CANCEL = '🚫 Отменить'
const ANONYMOUS = 'Анонимный пользователь'
const AUTHOR = 'Автор:'

/*
🔸 update = {
  update_id: 480418747,
  message: {
    message_id: 6,
    from: {
      id: 28831074,
      is_bot: false,
      first_name: 'Iurii',
      last_name: 'Belobeev',
      username: 'marsgpl',
      language_code: 'en'
    },
    chat: {
      id: 28831074,
      first_name: 'Iurii',
      last_name: 'Belobeev',
      username: 'marsgpl',
      type: 'private'
    },
    date: 1706529690,
    text: 'hey'
  }
}
*/

export async function onUpdate(
    api: TgBotApi,
    services: Services,
    update: TgBotResponse,
) {
    const { states, tgUsers, hints } = services

    const updateId = getUpdateId(update)
    const tgUserId = getUserId(update)

    const lastUpdateId = await states.getLastUpdateId()

    if (updateId <= lastUpdateId) {
        throw Error('update was already processed')
    }

    states.setLastUpdateId(updateId)

    const { chat, text } = update.message

    const isPrivateMsg = chat.type === 'private'

    if (!isPrivateMsg) {
        throw Error('group chats are not supported')
    }

    const tgUser = await tgUsers.getOrCreateByTgUserId(tgUserId, {
        _id: false,
        seenHintsIds: true,
        status: true,
    })

    switch (tgUser.status) {
        case TG_USER_STATUS_WAIT_FOR_HINT_INPUT:
            switch (text) {
                case ACTION_CANCEL:
                    await tgUsers.setStatusByTgUserId(tgUserId, TG_USER_STATUS_DEFAULT)
                    await sendCancelled(api, update)
                    break
                case ACTION_I_WANT_TO_GIVE_HINT:
                    await sendTypeYourHint(api, update)
                    break
                default:
                    await tgUsers.setStatusByTgUserId(tgUserId, TG_USER_STATUS_DEFAULT)
                    await hints.insert({
                        text,
                        authorTgUserId: tgUserId,
                        authorName: getName(update),
                    })
                    await sendHintAccepted(api, update)
                    break
            }
            break
        default:
            switch (text) {
                case ACTION_I_WANT_TO_GIVE_HINT: {
                    await tgUsers.setStatusByTgUserId(tgUserId, TG_USER_STATUS_WAIT_FOR_HINT_INPUT)
                    await sendTypeYourHint(api, update)
                    break
                }
                default: {
                    await giveHint(api, services, update, tgUser)
                    break
                }
            }
            break
    }
}

function getName(update: TgBotResponse): string {
    const { from } = update.message

    return from.username
        ? '@' + from.username
        : (from.first_name + ' ' + from.last_name).trim() || ANONYMOUS
}

async function giveHint(
    api: TgBotApi,
    services: Services,
    update: TgBotResponse,
    tgUser: TgUser,
) {
    const { hints, tgUsers } = services
    const tgUserId = getUserId(update)

    const hint = await hints.getNext(
        tgUser.seenHintsIds || [],
        {
            text: true,
            authorName: true,
        })

    if (hint?._id) {
        await tgUsers.addSeenHintId(tgUserId, hint._id)
    }

    let hintText = hint?.text

    if (hint && hintText) {
        hintText += '\n\n' + AUTHOR + ' ' + (hint.authorName || ANONYMOUS)
    }

    await sendHint(api, update, hintText)
}

function getUpdateId(update: TgBotResponse): number {
    const id = update.update_id

    if (typeof id !== 'number' || !Number.isFinite(id)) {
        throw Error('invalid update_id')
    }

    return id
}

function getUserId(update: TgBotResponse): number {
    const id = update.message?.from?.id

    if (typeof id !== 'number' || !Number.isFinite(id)) {
        throw Error('invalid message.from.id')
    }

    return id
}

function sendCancelled(api: TgBotApi, update: TgBotResponse) {
    return api.request(POST, 'sendMessage', {
        chat_id: update.message.chat.id,
        text: REPLY_OK,
        reply_parameters: JSON.stringify({
            message_id: update.message.message_id,
            chat_id: update.message.chat.id,
            allow_sending_without_reply: true,
        }),
        reply_markup: JSON.stringify({
            keyboard: [
                [
                    {
                        text: ACTION_GIVE_ME_HINT,
                    },
                ],
                [
                    {
                        text: ACTION_I_WANT_TO_GIVE_HINT,
                    },
                ]
            ],
            is_persistent: true,
            resize_keyboard: true,
            input_field_placeholder: PLACEHOLDER_SELECT_ACTION,
        })
    })
}

function sendTypeYourHint(api: TgBotApi, update: TgBotResponse) {
    return api.request(POST, 'sendMessage', {
        chat_id: update.message.chat.id,
        text: REPLY_SEND_ME_YOUR_HINT,
        reply_parameters: JSON.stringify({
            message_id: update.message.message_id,
            chat_id: update.message.chat.id,
            allow_sending_without_reply: true,
        }),
        reply_markup: JSON.stringify({
            keyboard: [
                [
                    {
                        text: ACTION_CANCEL,
                    },
                ]
            ],
            is_persistent: true,
            resize_keyboard: true,
            input_field_placeholder: PLACEHOLDER_HINT_EXAMPLE,
        })
    })
}

function sendHint(api: TgBotApi, update: TgBotResponse, hint?: string) {
    if (hint) {
        if (hint.length > 4096) {
            hint = hint.substring(0, 4096 - 3) + '...'
        }
    }

    return api.request(POST, 'sendMessage', {
        chat_id: update.message.chat.id,
        text: hint || REPLY_OUT_OF_HINTS,
        reply_markup: JSON.stringify({
            keyboard: [
                [
                    {
                        text: ACTION_GIVE_ME_HINT,
                    },
                ],
                [
                    {
                        text: ACTION_I_WANT_TO_GIVE_HINT,
                    },
                ]
            ],
            is_persistent: true,
            resize_keyboard: true,
            input_field_placeholder: PLACEHOLDER_SELECT_ACTION,
        })
    })
}

async function sendHintAccepted(api: TgBotApi, update: TgBotResponse) {
    return api.request(POST, 'sendMessage', {
        chat_id: update.message.chat.id,
        text: REPLY_HINT_ACCEPTED,
        reply_parameters: JSON.stringify({
            message_id: update.message.message_id,
            chat_id: update.message.chat.id,
            allow_sending_without_reply: true,
        }),
        reply_markup: JSON.stringify({
            keyboard: [
                [
                    {
                        text: ACTION_GIVE_ME_HINT,
                    },
                ],
                [
                    {
                        text: ACTION_I_WANT_TO_GIVE_HINT,
                    },
                ]
            ],
            is_persistent: true,
            resize_keyboard: true,
            input_field_placeholder: PLACEHOLDER_SELECT_ACTION,
        })
    })
}
