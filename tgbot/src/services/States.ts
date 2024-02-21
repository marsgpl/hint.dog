import { ObjectId } from 'mongodb'
import { BaseService } from './BaseService'
import { State } from 'src/models/State'

const stateId = new ObjectId('000000000000000000000001')

const projection = {
    _id: false,
    lastUpdateId: true,
}

export class States extends BaseService<State> {
    protected lastUpdateId?: number

    public async getLastUpdateId(): Promise<number> {
        if (this.lastUpdateId !== undefined) {
            return this.lastUpdateId
        }

        const state = await this.collection.findOne(
            { _id: stateId },
            { projection })

        if (state) {
            this.lastUpdateId = state.lastUpdateId || 0
            return this.lastUpdateId
        } else {
            this.setLastUpdateId(0)
            return 0
        }
    }

    public async setLastUpdateId(id: number) {
        this.lastUpdateId = id

        const upsRes = await this.collection.updateOne({
            _id: stateId,
        }, {
            $set: {
                lastUpdateId: id,
            },
        }, {
            upsert: true,
        })

        if (!upsRes.acknowledged) {
            throw Error(`setLastUpdateId: failed to upsert State`)
        }
    }
}
