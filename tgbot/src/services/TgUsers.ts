import { ObjectId } from 'mongodb'
import { BaseService, Projection } from './BaseService'
import { TgUser } from 'src/models/TgUser'

export class TgUsers extends BaseService<TgUser> {
    public async setStatusByTgUserId(tgUserId: number, status: number) {
        const updRes = await this.collection.updateOne({
            tgUserId,
        }, {
            $set: {
                status,
            },
        })

        if (!updRes.acknowledged) {
            throw Error('setStatusByTgUserId: failed to update TgUser')
        }
    }

    public async addSeenHintId(tgUserId: number, hintId: ObjectId) {
        const updRes = await this.collection.updateOne({
            tgUserId,
        }, {
            $push: {
                seenHintsIds: hintId,
            },
        })

        if (!updRes.acknowledged) {
            throw Error('addSeenHintId: failed to update TgUser')
        }
    }

    public async getOrCreateByTgUserId(
        tgUserId: number,
        projection: Projection<TgUser> = {},
    ): Promise<TgUser> {
        let user = await this.collection.findOne({ tgUserId }, { projection })

        if (user) {
            return user
        }

        const upsRes = await this.collection.updateOne({
            tgUserId,
        }, {
            $set: {},
        }, {
            upsert: true,
        })

        if (!upsRes.acknowledged) {
            throw Error('getOrCreateByTgUserId: failed to upsert TgUser')
        }

        user = await this.collection.findOne({ tgUserId }, { projection })

        if (user) {
            return user
        }

        throw Error(`TgUser not found by tgUserId=${tgUserId} after upsertion`)
    }
}
