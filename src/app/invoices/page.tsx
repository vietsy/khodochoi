"use client"
import { useEffect, useMemo, useState } from "react"
import styles from "@/styles/invoicesList.module.scss"
import { ProductType, CustomerType } from "@/types/types"
import { Button, Modal, Table } from "antd"
import Menu from "@/components/menu"
import { renderInvoiceHtml } from "@/ultils/invoiceTemplate"

interface PaidInvoice {
    id: string
    date: string
    customerCode: string
    customerName: string
    products: { product: ProductType; quantity: number; note?: string }[]
    totalAmount: number
    discount: number
    discountedAmount: number
    customerPay: number
    change: number
    paymentMethod: string
}

const InvoicesList = () => {
    const [invoices, setInvoices] = useState<PaidInvoice[]>([])
    const [customers, setCustomers] = useState<CustomerType[]>([])
    const [selected, setSelected] = useState<PaidInvoice | null>(null)
    const [previewVisible, setPreviewVisible] = useState(false)

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const res = await fetch("/api/invoices")
                if (!res.ok) throw new Error("Không lấy được danh sách hóa đơn")
                const data = await res.json()
                setInvoices(data)
            } catch (err) {
                console.error(err)
                const stored = localStorage.getItem("PAID_INVOICES")
                if (stored) setInvoices(JSON.parse(stored))
            }
        }

        const fetchCustomers = async () => {
            try {
                const res = await fetch("/api/customers")
                if (!res.ok) throw new Error("Không lấy được khách hàng")
                const data = await res.json()
                setCustomers(data)
            } catch (err) {
                console.error(err)
            }
        }

        fetchInvoices()
        fetchCustomers()
    }, [])

    const columns = useMemo(() => {
        return [
            { title: "Số hóa đơn", dataIndex: "id", key: "id" },
            { title: "Ngày", dataIndex: "date", key: "date" },
            { title: "Mã KH", dataIndex: "customerCode", key: "customerCode" },
            { title: "Tên KH", dataIndex: "customerName", key: "customerName" },
            {
                title: "Tổng",
                dataIndex: "discountedAmount",
                key: "discountedAmount",
                render: (v: number) => v.toLocaleString("en-US"),
            },
            {
                title: "Thao tác",
                key: "actions",
                render: (_: any, record: PaidInvoice) => (
                    <div style={{ display: "flex", gap: 8 }}>
                        <Button
                            onClick={() => {
                                setSelected(record)
                                setPreviewVisible(true)
                            }}
                        >
                            Xem
                        </Button>
                        <Button
                            onClick={() => {
                                const cust = customers.find((c) => c.maKhachHang === record.customerCode)
                                const currentCustomerDebt = cust?.noHienTai ?? 0
                                const html = renderInvoiceHtml(record, currentCustomerDebt)
                                const w = window.open("", "_blank")
                                if (w) {
                                    w.document.write(html)
                                    w.document.close()
                                    w.print()
                                }
                            }}
                        >
                            In
                        </Button>
                    </div>
                ),
            },
        ]
    }, [])

    return (
        <>
            <Menu />
            <section className={styles.invoices}>
                <h2 className={styles.invoices__title}>Danh sách hóa đơn đã thanh toán</h2>
                <Table rowKey="id" dataSource={invoices} columns={columns} pagination={{ pageSize: 10 }} className={styles.table} />

                <Modal open={previewVisible} onCancel={() => setPreviewVisible(false)} footer={null} width={860}>
                    {selected &&
                        (() => {
                            const cust = customers.find((c) => c.maKhachHang === selected.customerCode)
                            const currentCustomerDebt = cust?.noHienTai ?? 0
                            return <div dangerouslySetInnerHTML={{ __html: renderInvoiceHtml(selected, currentCustomerDebt) }} />
                        })()}
                </Modal>
            </section>
        </>
    )
}

export default InvoicesList
