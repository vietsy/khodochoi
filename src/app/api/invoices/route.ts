import { NextResponse } from "next/server"
import type { ProductType } from "../../../types/types"
import { connectMongo } from "@/lib/mongodb"

type PaidInvoice = {
    id: string
    date: string
    customerCode: string
    customerName: string
    products: { product: ProductType; quantity: number }[]
    totalAmount: number
    discount: number
    discountedAmount: number
    customerPay: number
    change: number
    paymentMethod: string
}

export async function GET() {
    const { db } = await connectMongo()
    const collection = db.collection<PaidInvoice>("invoices")
    const invoices = await collection.find().sort({ date: -1 }).toArray()
    return NextResponse.json(invoices)
}

export async function POST(req: Request) {
    try {
        const payload = await req.json()
        const { db } = await connectMongo()
        const collection = db.collection<PaidInvoice>("invoices")
        await collection.insertOne(payload)
        return NextResponse.json(payload)
    } catch (error) {
        return NextResponse.json({ error: "Không lưu được hóa đơn" }, { status: 500 })
    }
}
