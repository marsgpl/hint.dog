import { ObjectId } from 'mongodb'
import { BaseService, Projection } from './BaseService'
import { Hint } from 'src/models/Hint'

export class Hints extends BaseService<Hint> {
    public getNext(
        seenHintsIds: ObjectId[],
        projection: Projection<Hint> = {},
    ) {
        const filter = seenHintsIds.length ? {
            _id: {
                $nin: seenHintsIds,
            },
        } : {}

        return this.collection.findOne(filter, { projection })
    }
}
