import { NextResponse } from "next/server"
import { connectMongo } from "@/lib/mongodb"
import { nhomHangOptionsData } from "../../../__mock__/nhomHang"

export async function GET() {
    const { db } = await connectMongo()
    const collection = db.collection<{ item: string }>("nhomHangOptions")
    const options = await collection.find().project({ _id: 0, item: 1 }).toArray()

    if (!options.length) {
        return NextResponse.json(nhomHangOptionsData)
    }

    return NextResponse.json(options.map((option) => option.item))
}

export async function POST(request: Request) {
    const body = await request.json()
    const item = typeof body?.item === "string" ? body.item.trim() : ""

    if (!item) {
        return new NextResponse(JSON.stringify({ message: "Nhóm hàng không được để trống" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        })
    }

    const { db } = await connectMongo()
    const collection = db.collection<{ item: string }>("nhomHangOptions")
    const existing = await collection.findOne({ item })

    if (!existing) {
        await collection.insertOne({ item })
    }

    const allOptions = await collection.find().project({ _id: 0, item: 1 }).toArray()
    return NextResponse.json(
        allOptions.map((option) => option.item),
        { status: existing ? 200 : 201 }
    )
}
