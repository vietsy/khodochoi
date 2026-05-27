import { NextResponse } from "next/server"
import type { ProductType } from "../../../types/types"
import { connectMongo } from "@/lib/mongodb"
import dayjs from "dayjs"

export async function GET(request: Request) {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    const { db } = await connectMongo()
    const collection = db.collection<ProductType>("products")

    if (id) {
        const item = await collection.findOne({ id })
        if (!item) {
            return new NextResponse(JSON.stringify({ message: "Product not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            })
        }
        return NextResponse.json(item)
    }

    const products = await collection.find().sort({ _id: -1 }).toArray()

    return NextResponse.json(products)
}

export async function POST(request: Request) {
    const body = await request.json()
    if (!body || !body.maHang || !body.tenHang || !body.nhomHang) {
        return new NextResponse(JSON.stringify({ message: "Missing required fields" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        })
    }

    const { db } = await connectMongo()
    const collection = db.collection<ProductType>("products")
    const newProduct: ProductType = {
        ...body,
        id: `${body.maHang}_${Date.now()}`,
        thoiGianTao: dayjs().format("HH:mm DD/MM/YYYY"),
    }

    await collection.insertOne(newProduct)
    return NextResponse.json(newProduct, { status: 201 })
}

export async function PUT(request: Request) {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id) {
        return new NextResponse(JSON.stringify({ message: "Product id is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        })
    }

    const body = await request.json()
    const { db } = await connectMongo()
    const collection = db.collection<ProductType>("products")
    const result = await collection.updateOne({ id }, { $set: body })

    if (result.matchedCount === 0) {
        return new NextResponse(JSON.stringify({ message: "Product not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
        })
    }

    return NextResponse.json({ message: "Product updated" })
}

export async function DELETE(request: Request) {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id) {
        return new NextResponse(JSON.stringify({ message: "Product id is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        })
    }

    const { db } = await connectMongo()
    const collection = db.collection<ProductType>("products")
    const result = await collection.deleteOne({ id })

    if (result.deletedCount === 0) {
        return new NextResponse(JSON.stringify({ message: "Product not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
        })
    }

    return NextResponse.json({ message: "Product deleted" })
}
