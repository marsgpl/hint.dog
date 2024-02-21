import {
    Collection,
    Document,
    MongoClient,
    ObjectId,
    OptionalUnlessRequiredId,
} from 'mongodb'

export const MONGODB_ERROR_CODE_DUPLICATE_ENTRY = 11000

export type Projection<D extends Document> = Partial<Record<keyof D, boolean>>

export abstract class BaseService<D extends Document> {
    protected lazyCollection: Collection<D> | undefined

    constructor(
        protected mongo: MongoClient,
        protected collectionName: string,
    ) {}

    protected get collection() {
        let collection = this.lazyCollection

        if (!collection) {
            collection = this.mongo.db().collection(this.collectionName)
            this.lazyCollection = collection
        }

        return collection
    }

    public async insert(doc: OptionalUnlessRequiredId<D>) {
        const insRes = await this.collection.insertOne(doc)

        if (!insRes.acknowledged || !insRes.insertedId) {
            throw Error(`insert: Failed to create entity`)
        }

        return insRes.insertedId
    }

    public getById(
        id: ObjectId,
        projection?: Projection<D>,
    ) {
        return this.collection.findOne({
            _id: id as any,
        }, {
            projection,
        })
    }

    public async getByIds(
        ids: ObjectId[],
        projection?: Projection<D>,
    ) {
        const cursor = this.collection.find({
            _id: {
                $in: ids as any[],
            },
        }, {
            projection,
            limit: ids.length,
        })

        const rows = await cursor.toArray()

        await cursor.close()

        return rows
    }

    protected isDupError(error: unknown): boolean {
        return Boolean(error && (error as any).code === MONGODB_ERROR_CODE_DUPLICATE_ENTRY)
    }
}
