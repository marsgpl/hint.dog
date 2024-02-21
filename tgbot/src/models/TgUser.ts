import { ObjectId } from 'mongodb'

export interface TgUser {
    _id?: ObjectId
    tgUserId?: number
    seenHintsIds?: ObjectId[]
    status?: number
}

export const TG_USER_STATUS_DEFAULT = 0 // or undefined
export const TG_USER_STATUS_WAIT_FOR_HINT_INPUT = 1
