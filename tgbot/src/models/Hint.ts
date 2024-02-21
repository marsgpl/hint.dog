import { ObjectId } from 'mongodb'

export interface Hint {
    _id?: ObjectId
    text?: string
    authorTgUserId?: number
    authorName?: string
}
