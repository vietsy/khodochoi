import { NextResponse, NextRequest } from "next/server"
import { connectMongo } from "@/lib/mongodb"

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params
        console.log("Deleting customer with id:", id)

        const { db } = await connectMongo()
        const collection = db.collection("customers")

        const result = await collection.deleteOne({ maKhachHang: id })

        console.log("Delete result:", result)

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: "Không tìm thấy khách hàng" }, { status: 404 })
        }

        return NextResponse.json({ success: true, message: "Xóa khách hàng thành công" })
    } catch (error) {
        console.error("Delete error:", error)
        return NextResponse.json({ error: "Không thể xóa khách hàng: " + error }, { status: 500 })
    }
}
