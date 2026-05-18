import { MongoClient, Db } from "mongodb"

const dbName = process.env.MONGODB_DB || "khodochoi"

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function connectMongo() {
    const uri = process.env.MONGODB_URI
    if (!uri) {
        throw new Error("Please define the MONGODB_URI environment variable (set it in Vercel Environment Variables)")
    }

    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb }
    }

    const client = new MongoClient(uri)
    try {
        await client.connect()
        const db = client.db(dbName)

        cachedClient = client
        cachedDb = db
        return { client, db }
    } catch (err) {
        // ensure we close the client on failure
        try {
            await client.close()
        } catch (e) {
            // ignore
        }
        throw err
    }
}
