import { NextResponse } from "next/server"
import type { CustomerType } from "../../../types/types"
import { connectMongo } from "@/lib/mongodb"

export async function GET() {
    const { db } = await connectMongo()
    const collection = db.collection<CustomerType>("customers")
    const customers = await collection.find().toArray()
    return NextResponse.json(customers)
}

export async function POST(request: Request) {
    const body = await request.json()

    if (!body || !body.maKhachHang || !body.tenKhachHang) {
        return new NextResponse(JSON.stringify({ message: "Thiếu thông tin khách hàng" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        })
    }

    const { db } = await connectMongo()
    const collection = db.collection<CustomerType>("customers")
    const newCustomer: CustomerType = {
        maKhachHang: body.maKhachHang,
        tenKhachHang: body.tenKhachHang,
        dt: body.dt ?? "",
        noHienTai: body.noHienTai ?? 0,
        tongban: body.tongban ?? 0,
    }

    await collection.insertOne(newCustomer)
    return NextResponse.json(newCustomer, { status: 201 })
}

export async function PUT(request: Request) {
    const body = await request.json()
    if (!body || !body.maKhachHang) {
        return new NextResponse(JSON.stringify({ message: "Thiếu mã khách hàng" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        })
    }

    const { db } = await connectMongo()
    const collection = db.collection<CustomerType>("customers")
    const updated = await collection.findOneAndUpdate({ maKhachHang: body.maKhachHang }, { $set: body }, { returnDocument: "after" })

    if (!updated) {
        return new NextResponse(JSON.stringify({ message: "Không tìm thấy khách hàng" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
        })
    }

    return NextResponse.json(updated)
}
