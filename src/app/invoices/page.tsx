"use client"
import { useEffect, useState } from "react"
import styles from "@/styles/invoicesList.module.scss"
import { ProductType } from "@/types/product"
import { Button } from "antd"
import Menu from "@/components/menu"

interface PaidInvoice {
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

const InvoicesList = () => {
    const [invoices, setInvoices] = useState<PaidInvoice[]>([])

    useEffect(() => {
        const stored = localStorage.getItem("PAID_INVOICES")
        if (stored) {
            setInvoices(JSON.parse(stored))
        }
    }, [])

    const handlePrint = (invoice: PaidInvoice) => {
        const printWindow = window.open("", "_blank")
        if (!printWindow) return

        printWindow.document.write(`
      <html>
        <head>
          <title>Hóa đơn #${invoice.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            th { background-color: #f0f0f0; }
          </style>
        </head>
        <body>
          <h2>Hóa đơn #${invoice.id}</h2>
          <p><strong>Ngày:</strong> ${invoice.date}</p>
          <p><strong>Mã KH:</strong> ${invoice.customerCode}</p>
          <p><strong>Tên KH:</strong> ${invoice.customerName}</p>
          <p><strong>Phương thức:</strong> ${invoice.paymentMethod === "tienMat" ? "Tiền mặt" : "Chuyển khoản"}</p>
          <p><strong>Tổng tiền hàng:</strong> ${invoice.totalAmount.toLocaleString("en-US")} đ</p>
          <p><strong>Giảm giá:</strong> ${invoice.discount}%</p>
          <p><strong>Khách cần trả:</strong> ${invoice.discountedAmount.toLocaleString("en-US")} đ</p>
          <p><strong>Khách thanh toán:</strong> ${invoice.customerPay.toLocaleString("en-US")} đ</p>
          <p><strong>${invoice.change >= 0 ? "Tiền thừa:" : "Khách còn thiếu:"}</strong> ${Math.abs(invoice.change).toLocaleString("en-US")} đ</p>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Mã hàng</th>
                <th>Tên hàng</th>
                <th>Số lượng</th>
                <th>Giá bán</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.products
                  .map(
                      (item, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${item.product.maHang}</td>
                  <td>${item.product.tenHang}</td>
                  <td>${item.quantity}</td>
                  <td>${(item.product.giaBan || 0).toLocaleString("en-US")} đ</td>
                  <td>${((item.product.giaBan || 0) * item.quantity).toLocaleString("en-US")} đ</td>
                </tr>
              `
                  )
                  .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `)

        printWindow.document.close()
        printWindow.print()
    }

    return (
        <>
            <Menu />
            <section className={styles.invoices}>
                <h2 className={styles.invoices__title}>Danh sách hóa đơn đã thanh toán</h2>
                {invoices.length === 0 && <p>Chưa có hóa đơn nào được thanh toán.</p>}

                {invoices.map((invoice) => (
                    <div key={invoice.id} className={styles.invoice}>
                        <h3 className={styles.invoice__header}>
                            Hóa đơn #{invoice.id} - {invoice.date}
                        </h3>
                        <p>
                            <strong>Mã KH:</strong> {invoice.customerCode}
                        </p>
                        <p>
                            <strong>Tên KH:</strong> {invoice.customerName}
                        </p>
                        <p>
                            <strong>Phương thức:</strong> {invoice.paymentMethod === "tienMat" ? "Tiền mặt" : "Chuyển khoản"}
                        </p>
                        <p>
                            <strong>Tổng tiền hàng:</strong> {invoice.totalAmount.toLocaleString("en-US")} đ
                        </p>
                        <p>
                            <strong>Khách cần trả:</strong> {invoice.discountedAmount.toLocaleString("en-US")} đ
                        </p>
                        <p>
                            <strong>Khách thanh toán:</strong> {invoice.customerPay.toLocaleString("en-US")} đ
                        </p>
                        <p>
                            <strong>{invoice.change >= 0 ? "Tiền thừa:" : "Khách còn thiếu:"}</strong> {Math.abs(invoice.change).toLocaleString("en-US")} đ
                        </p>

                        <Button type="primary" onClick={() => handlePrint(invoice)}>
                            In hóa đơn
                        </Button>
                    </div>
                ))}
            </section>
        </>
    )
}

export default InvoicesList
