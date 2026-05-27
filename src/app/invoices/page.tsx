"use client"
import { useEffect, useMemo, useState } from "react"
import styles from "@/styles/invoicesList.module.scss"
import { ProductType, CustomerType } from "@/types/types"
import { Button, Modal, Table, message } from "antd"
import Menu from "@/components/menu"
import { renderInvoiceHtml } from "@/ultils/invoiceTemplate"
import dayjs from "dayjs"

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
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const sortByDateDesc = (arr: any[]) => {
            return arr.slice().sort((a, b) => {
                const da = dayjs(a.date, "DD/MM/YYYY HH:mm").valueOf() || 0
                const db = dayjs(b.date, "DD/MM/YYYY HH:mm").valueOf() || 0
                return db - da
            })
        }

        const fetchInvoices = async () => {
            try {
                setLoading(true)
                const res = await fetch("/api/invoices")
                if (!res.ok) throw new Error("Không lấy được danh sách hóa đơn")
                const data = await res.json()
                setInvoices(sortByDateDesc(data))
            } catch (err) {
                console.error(err)
                const stored = localStorage.getItem("PAID_INVOICES")
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored)
                        setInvoices(sortByDateDesc(parsed))
                    } catch (e) {
                        console.error("Invalid PAID_INVOICES in localStorage", e)
                    }
                }
            } finally {
                setLoading(false)
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
            { title: "Số hóa đơn", dataIndex: "id", key: "id", ellipsis: true },
            { title: "Ngày", dataIndex: "date", key: "date", ellipsis: true },
            { title: "Mã KH", dataIndex: "customerCode", key: "customerCode", ellipsis: true },
            { title: "Tên KH", dataIndex: "customerName", key: "customerName", ellipsis: true },
            {
                title: "Tổng",
                dataIndex: "discountedAmount",
                key: "discountedAmount",
                render: (v: number) => v.toLocaleString("en-US"),
                ellipsis: true,
            },
            {
                title: "Thao tác",
                key: "actions",
                ellipsis: true,
                render: (_: any, record: PaidInvoice) => (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
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
                        <Button
                            danger
                            onClick={() => {
                                Modal.confirm({
                                    title: "Xóa hóa đơn",
                                    content: `Bạn có chắc chắn muốn xóa hóa đơn ${record.id}?`,
                                    okText: "Xóa",
                                    cancelText: "Hủy",
                                    okButtonProps: { danger: true },
                                    onOk: async () => {
                                        try {
                                            console.log("Deleting invoice:", record.id)
                                            const res = await fetch(`/api/invoices/${record.id}`, {
                                                method: "DELETE",
                                            })
                                            const data = await res.json()
                                            console.log("Delete response:", data, "Status:", res.status)

                                            if (!res.ok) {
                                                throw new Error(data?.error || "Không thể xóa hóa đơn")
                                            }

                                            setInvoices(invoices.filter((inv) => inv.id !== record.id))
                                            message.success("Xóa hóa đơn thành công")
                                        } catch (err: any) {
                                            console.error("Delete error:", err)
                                            message.error(err.message || "Xóa hóa đơn thất bại")
                                        }
                                    },
                                })
                            }}
                        >
                            Xóa
                        </Button>
                    </div>
                ),
            },
        ]
    }, [invoices, customers])

    return (
        <>
            <Menu />
            <section className={styles.invoices}>
                <h2 className={styles.invoices__title}>Danh sách hóa đơn đã thanh toán</h2>
                <Table rowKey="id" dataSource={invoices} columns={columns} pagination={{ pageSize: 10 }} className={styles.table} loading={loading} />

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
