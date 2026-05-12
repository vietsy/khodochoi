"use client"
import styles from "@/components/paymentSide/styles/PaymentSide.module.scss"
import { ProductType } from "@/types/product"
import { AutoComplete, Button, Input, InputNumber, InputNumberProps, Radio } from "antd"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PRODUCTS_KEY } from "@/constand/constand"

interface Tab {
    key: string
    title: string
    products: { product: ProductType; quantity: number }[]
}

interface PaymentSideProps {
    products: { product: ProductType; quantity: number }[]
    activeTab: string
    tabs: Tab[]
    setTabs: (tabs: Tab[]) => void
}

interface CustomerType {
    maKhachHang: string
    tenKhachHang: string
    dt: string
    noHienTai: number
    tongban: number
}

const formatter: InputNumberProps<number>["formatter"] = (value) => {
    const [start, end] = `${value}`.split(".") || []
    const v = `${start}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    return `${end ? `${v}.${end}` : `${v}`}`
}

const PaymentSide = ({ products, activeTab, tabs, setTabs }: PaymentSideProps) => {
    const [items, setItems] = useState<{ product: ProductType; quantity: number }[]>([])
    const [discount, setDiscount] = useState<number>(0)
    const [customerPay, setCustomerPay] = useState<number>(0)
    const [paymentMethod, setPaymentMethod] = useState<string>("tienMat")
    const [customerCode, setCustomerCode] = useState<string>("")
    const [customerOptions, setCustomerOptions] = useState<{ value: string }[]>([])
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerType | null>(null)
    const router = useRouter()

    useEffect(() => {
        setItems(Array.isArray(products) ? products : [])
    }, [products])

    // load danh sách khách hàng
    useEffect(() => {
        const stored = localStorage.getItem("CUSTOMERS")
        if (stored) {
            const customers = JSON.parse(stored) as CustomerType[]
            setCustomerOptions(customers.map((c) => ({ value: c.maKhachHang })))
        }
    }, [])

    const handleCustomerSearch = (value: string) => {
        setCustomerCode(value)
        const stored = localStorage.getItem("CUSTOMERS")
        if (stored) {
            const customers = JSON.parse(stored) as CustomerType[]
            const filtered = customers.filter((c) => c.maKhachHang.toLowerCase().includes(value.toLowerCase()))
            setCustomerOptions(filtered.map((c) => ({ value: c.maKhachHang })))
        }
    }

    const handleCustomerSelect = (value: string) => {
        setCustomerCode(value)
        const stored = localStorage.getItem("CUSTOMERS")
        if (stored) {
            const customers = JSON.parse(stored) as CustomerType[]
            const found = customers.find((c) => c.maKhachHang === value)
            if (found) setSelectedCustomer(found)
        }
    }

    const totalAmount = (items || []).reduce((sum, item) => sum + (item.product.giaBan || 0) * item.quantity, 0)

    const discountedAmount = totalAmount - (totalAmount * discount) / 100
    const change = customerPay - discountedAmount

    useEffect(() => {
        setCustomerPay(discountedAmount)
    }, [discountedAmount])

    const handleCheckout = () => {
        if (items.length === 0) {
            alert("Không có sản phẩm trong hóa đơn!")
            return
        }

        // 1. Tạo hóa đơn đã thanh toán
        const invoice = {
            id: Date.now().toString(),
            date: dayjs().format("DD/MM/YYYY HH:mm"),
            customerCode,
            customerName: selectedCustomer?.tenKhachHang || "", // tên KH nếu có
            products: items,
            totalAmount,
            discount,
            discountedAmount,
            customerPay, // số tiền khách thanh toán
            change, // tiền thừa (+) hoặc còn thiếu (-)
            paymentMethod,
        }

        const paidInvoices = JSON.parse(localStorage.getItem("PAID_INVOICES") || "[]")
        paidInvoices.push(invoice)
        localStorage.setItem("PAID_INVOICES", JSON.stringify(paidInvoices))

        // 2. Cập nhật tồn kho
        const allProducts: ProductType[] = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || "[]")
        const updatedProducts = allProducts.map((p) => {
            const sold = items.find((i) => i.product.id === p.id)
            if (sold) {
                return { ...p, tonKho: (p.tonKho || 0) - sold.quantity }
            }
            return p
        })
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedProducts))

        // 3. Cập nhật khách hàng (chỉ nếu có trong danh sách)
        const customers: CustomerType[] = JSON.parse(localStorage.getItem("CUSTOMERS") || "[]")
        const updatedCustomers = customers.map((c) => {
            if (c.maKhachHang === customerCode) {
                return {
                    ...c,
                    tongban: (c.tongban || 0) + discountedAmount,
                    noHienTai: change < 0 ? (c.noHienTai || 0) + Math.abs(change) : c.noHienTai,
                }
            }
            return c
        })
        localStorage.setItem("CUSTOMERS", JSON.stringify(updatedCustomers))

        // 4. Reset tab và điều hướng
        const newTabs = tabs.filter((t) => t.key !== activeTab)
        const newTab: Tab = {
            key: Date.now().toString(),
            title: `Hóa đơn ${newTabs.length + 1}`,
            products: [],
        }
        const updatedTabs = [...newTabs, newTab]
        setTabs(updatedTabs)
        localStorage.setItem("INVOICES", JSON.stringify(updatedTabs))

        router.push("/invoices")
    }

    return (
        <section className={styles.payment}>
            <h3 className={styles.payment__title}>
                Kho đồ chơi Ngân Anh
                <span>{dayjs(Date()).format("DD/MM/YYYY HH:mm")}</span>
            </h3>
            <div className={styles.payment__content}>
                <div className={styles.payment__info}>
                    <span className={styles.payment__label}>Mã khách hàng:</span>
                    <AutoComplete
                        className={styles.payment__input}
                        options={customerOptions}
                        value={customerCode}
                        onSearch={handleCustomerSearch}
                        onSelect={handleCustomerSelect}
                        onChange={(val) => setCustomerCode(val)}
                        placeholder="Tìm mã khách hàng"
                        variant="underlined"
                        style={{ width: "100%" }}
                    />
                </div>

                {selectedCustomer && (
                    <div className={styles.payment__info}>
                        <span className={styles.payment__label}>Tên KH:</span>
                        <span>{selectedCustomer.tenKhachHang}</span>
                    </div>
                )}

                <div className={styles.payment__info}>
                    <span className={styles.payment__label}>
                        Tổng tiền hàng: <strong>{items.length}</strong>
                    </span>
                    <span>{totalAmount.toLocaleString("en-US")}</span>
                </div>

                <div className={styles.payment__info}>
                    <span className={styles.payment__label}>Giảm giá:</span>
                    <InputNumber className={styles.payment__input} suffix="%" value={discount} onChange={(val) => setDiscount(val || 0)} variant="underlined" />
                </div>

                <div className={styles.payment__info}>
                    <span className={styles.payment__label}>Khách cần trả:</span>
                    <span>{discountedAmount.toLocaleString("en-US")}</span>
                </div>

                <div className={styles.payment__info}>
                    <span className={styles.payment__label}>Khách thanh toán:</span>
                    <InputNumber
                        className={styles.payment__input}
                        value={customerPay}
                        onChange={(val) => setCustomerPay(val || 0)}
                        formatter={formatter}
                        parser={(val) => val?.replace(/\,/g, "") as unknown as number}
                        variant="underlined"
                    />
                </div>

                <div className={styles.payment__info}>
                    <span className={styles.payment__label}>{change >= 0 ? "Tiền thừa:" : "Khách còn thiếu:"}</span>
                    <span>{Math.abs(change).toLocaleString("en-US")}</span>
                </div>

                <div className={styles.payment__info}>
                    <Radio.Group
                        className={styles.payment__radio}
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        options={[
                            { value: "tienMat", label: "Tiền mặt" },
                            { value: "chuyenKhoan", label: "Chuyển khoản" },
                        ]}
                    />
                </div>
            </div>

            <Button className={styles.payment__btn} type="primary" size="large" onClick={handleCheckout}>
                Thanh toán
            </Button>
        </section>
    )
}

export default PaymentSide
