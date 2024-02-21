import { ObjectId } from 'mongodb'

export interface State {
    _id?: ObjectId
    lastUpdateId?: number
}
