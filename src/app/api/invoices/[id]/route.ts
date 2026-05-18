import { NextResponse, NextRequest } from "next/server"
import { connectMongo } from "@/lib/mongodb"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = await params
        console.log("Deleting invoice with id:", id)

        const { db } = await connectMongo()
        const collection = db.collection("invoices")

        const result = await collection.deleteOne({ id: id })

        console.log("Delete result:", result)

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: "Không tìm thấy hóa đơn" }, { status: 404 })
        }

        return NextResponse.json({ success: true, message: "Xóa hóa đơn thành công" })
    } catch (error) {
        console.error("Delete error:", error)
        return NextResponse.json({ error: "Không thể xóa hóa đơn: " + error }, { status: 500 })
    }
}
