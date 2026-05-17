import { NextResponse } from "next/server"
import { connectMongo } from "@/lib/mongodb"
import type { Tab } from "@/types/types"

const DRAFT_ID = "invoiceDrafts"

export async function GET() {
    const { db } = await connectMongo()
    const collection = db.collection<{ _id: string; tabs: Tab[] }>("drafts")
    const draft = await collection.findOne({ _id: DRAFT_ID })
    return NextResponse.json(draft?.tabs ?? [])
}

export async function POST(request: Request) {
    try {
        const tabs = (await request.json()) as Tab[]
        if (!Array.isArray(tabs)) {
            return new NextResponse(JSON.stringify({ message: "Drafts must be an array" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            })
        }

        const { db } = await connectMongo()
        const collection = db.collection<{ _id: string; tabs: Tab[] }>("drafts")
        await collection.updateOne({ _id: DRAFT_ID }, { $set: { tabs } }, { upsert: true })

        return NextResponse.json({ success: true })
    } catch (error) {
        return new NextResponse(JSON.stringify({ message: "Không lưu được bản nháp" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        })
    }
}
