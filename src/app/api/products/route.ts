import { NextResponse } from "next/server"
import type { ProductType } from "../../../types/types"
import { connectMongo } from "@/lib/mongodb"
import dayjs from "dayjs"

export const runtime = "nodejs"

export async function GET(request: Request) {
    try {
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
    } catch (error) {
        console.error("GET /api/products failed", error)
        return NextResponse.json([], { status: 200 })
    }
}

export async function POST(request: Request) {
    try {
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
    } catch (error) {
        console.error("POST /api/products failed", error)
        return NextResponse.json({ message: "Không thể lưu sản phẩm" }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
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
    } catch (error) {
        console.error("PUT /api/products failed", error)
        return NextResponse.json({ message: "Không thể cập nhật sản phẩm" }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
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
    } catch (error) {
        console.error("DELETE /api/products failed", error)
        return NextResponse.json({ message: "Không thể xóa sản phẩm" }, { status: 500 })
    }
}
