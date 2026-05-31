"use client"
import styles from "@/components/paymentSide/styles/PaymentSide.module.scss"
import { CustomerType, ProductType, Tab } from "@/types/types"
import { AutoComplete, Button, InputNumber, Modal, Radio, Select } from "antd"
import dayjs from "dayjs"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { formatter, parseMoney } from "@/ultils/format"
import { renderInvoiceHtml, numberToVietnameseWords, getInvoiceNumber } from "@/ultils/invoiceTemplate"

interface PaymentSideProps {
    products: { product: ProductType; quantity: number; note?: string; unitPrice?: number }[]
    activeTab: string
    tabs: Tab[]
    setTabs: (tabs: Tab[]) => void
    saveDrafts: (tabs: Tab[]) => void
    priceType: "giaBanSi" | "giaBanLe"
    onPriceTypeChange: (priceType: "giaBanSi" | "giaBanLe") => void
    locked?: boolean
    onToggleLock?: () => void
}

const PaymentSide = ({ products, activeTab, tabs, setTabs, saveDrafts, priceType, onPriceTypeChange, locked = false, onToggleLock }: PaymentSideProps) => {
    const [items, setItems] = useState<{ product: ProductType; quantity: number; note?: string; unitPrice?: number }[]>([])
    const [paymentMethod, setPaymentMethod] = useState<string>("tienMat")
    const [discount, setDiscount] = useState<number>(0)
    const [customerPay, setCustomerPay] = useState<number>(0)
    const [customers, setCustomers] = useState<CustomerType[]>([])
    const [customerSearch, setCustomerSearch] = useState<string>("")
    const [customerCode, setCustomerCode] = useState<string>("")
    const [customerName, setCustomerName] = useState<string>("")
    const [previewVisible, setPreviewVisible] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [customerPayEdited, setCustomerPayEdited] = useState(false)

    const router = useRouter()
    const isLocked = locked

    useEffect(() => {
        setItems(Array.isArray(products) ? products : [])
    }, [products])

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await fetch("/api/customers")
                if (!response.ok) throw new Error("Không thể tải khách hàng")
                const data: CustomerType[] = await response.json()
                setCustomers(data)
            } catch (error) {
                console.error(error)
            }
        }

        fetchCustomers()
    }, [])

    useEffect(() => {
        const currentTab = tabs.find((tab) => tab.key === activeTab)
        if (currentTab) {
            setCustomerCode(currentTab.customerCode ?? "")
            setCustomerName(currentTab.customerName ?? "")
            if (currentTab.customerCode) {
                setCustomerSearch(`${currentTab.customerCode} - ${currentTab.customerName ?? ""}`)
            } else {
                setCustomerSearch(currentTab.customerName ?? "")
            }
            setPaymentMethod(currentTab.paymentMethod ?? "tienMat")
        }
    }, [activeTab, tabs])

    const parseCustomerInput = (value: string) => {
        const parts = value.split(" - ")
        if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
            return { code: parts[0].trim(), name: parts.slice(1).join(" - ").trim() }
        }
        return { code: "", name: value.trim() }
    }

    const findCustomer = (value: string) => {
        const normalized = value.trim().toLowerCase()
        return customers.find(
            (customer) =>
                customer.maKhachHang.toLowerCase() === normalized ||
                customer.tenKhachHang.toLowerCase() === normalized ||
                `${customer.maKhachHang} - ${customer.tenKhachHang}`.toLowerCase() === normalized
        )
    }

    const updateCurrentTabCustomer = (code: string, name: string) => {
        const customerTitle = name.trim()
        updateCurrentTabFields({
            customerCode: code,
            customerName: name,
            ...(customerTitle ? { title: customerTitle } : {}),
        })
    }

    const updateCurrentTabFields = (fields: Partial<Tab>) => {
        const newTabs = tabs.map((tab) => (tab.key === activeTab ? { ...tab, ...fields } : tab))
        setTabs(newTabs)
        saveDrafts(newTabs)
    }

    const getPrice = (product: ProductType) => {
        return priceType === "giaBanSi" ? (product.giaBanSi ?? 0) : (product.giaBanLe ?? 0)
    }

    const getItemPrice = (item: { product: ProductType; unitPrice?: number }) => {
        return typeof item.unitPrice === "number" ? item.unitPrice : getPrice(item.product)
    }

    const totalQuantity = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])
    const totalAmount = useMemo(
        () =>
            items.reduce((sum, item) => {
                const price =
                    typeof item.unitPrice === "number" ? item.unitPrice : priceType === "giaBanSi" ? (item.product.giaBanSi ?? 0) : (item.product.giaBanLe ?? 0)
                return sum + price * item.quantity
            }, 0),
        [items, priceType]
    )
    const discountedAmount = useMemo(() => totalAmount * (1 - discount / 100), [totalAmount, discount])
    const change = useMemo(() => customerPay - discountedAmount, [customerPay, discountedAmount])

    useEffect(() => {
        // nếu người dùng chưa chỉnh số tiền thanh toán, tự động điền bằng số tiền cần trả
        if (!customerPayEdited) {
            setCustomerPay(discountedAmount)
        }
    }, [discountedAmount, customerPayEdited])

    const handlePreview = () => {
        setPreviewVisible(true)
    }

    const renderPaymentInvoiceHtml = () => {
        const invoice = {
            id: `${Date.now()}`,
            date: dayjs().format("DD/MM/YYYY HH:mm"),
            customerCode: customerCode || "",
            customerName: customerName || "",
            // snapshot unitPrice for each item so invoice keeps selected price
            products: items.map((item) => ({ ...item, unitPrice: getItemPrice(item) })),
            totalAmount: totalAmount,
            discount,
            discountedAmount,
            customerPay,
            change,
            paymentMethod,
        }
        return renderInvoiceHtml(invoice, currentCustomerDebt)
    }

    const handlePrintInvoice = () => {
        const printWindow = window.open("", "_blank")
        if (!printWindow) return

        printWindow.document.write(renderPaymentInvoiceHtml())
        printWindow.document.close()
        printWindow.print()
    }

    const handlePay = async () => {
        const invoice = {
            id: `${Date.now()}`,
            date: dayjs().format("DD/MM/YYYY HH:mm"),
            customerCode: customerCode || "",
            customerName: customerName || "",
            // include unitPrice snapshot per item
            products: items.map((item) => ({ ...item, unitPrice: getItemPrice(item) })),
            totalAmount: totalAmount,
            discount,
            discountedAmount,
            customerPay,
            change,
            paymentMethod,
        }

        try {
            setIsSaving(true)
            const res = await fetch("/api/invoices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(invoice),
            })
            if (!res.ok) throw new Error("Lưu hóa đơn thất bại")

            // cập nhật PAID_INVOICES trong localStorage để giữ lại bản sao
            try {
                const stored = localStorage.getItem("PAID_INVOICES")
                const arr = stored ? JSON.parse(stored) : []
                arr.unshift(invoice)
                localStorage.setItem("PAID_INVOICES", JSON.stringify(arr))
            } catch (e) {
                console.warn("Không thể cập nhật PAID_INVOICES localStorage", e)
            }

            // Sau khi lưu, đánh dấu tab là đã thanh toán và xóa sản phẩm/khách hàng khỏi tab hiện tại
            // const newTabs = tabs.map((tab) => (tab.key === activeTab ? { ...tab, products: [], customerCode: "", customerName: "", paid: true } : tab))
            // setTabs(newTabs)
            // localStorage.setItem(STORAGE_KEY, JSON.stringify(newTabs))
            // setItems([])
            // setCustomerCode("")
            // setCustomerName("")
            // setCustomerSearch("")
            // setCustomerPay(0)
            // setCustomerPayEdited(false)
            // setDiscount(0)
            // setPreviewVisible(false)

            // thông báo và chuyển trang đến danh sách hóa đơn
            alert("Thanh toán thành công")
            setIsSaving(false)
            // Cập nhật thông tin khách hàng: tổng bán và nợ hiện tại
            try {
                if (customerCode) {
                    const found = customers.find((c) => c.maKhachHang === customerCode)
                    const prevDebt = found?.noHienTai ?? 0
                    const prevTongban = found?.tongban ?? 0
                    const addedDebt = Math.max(0, discountedAmount - customerPay)
                    const surplus = Math.max(0, customerPay - discountedAmount)
                    const finalDebt = Math.max(0, prevDebt + addedDebt - surplus)
                    const updatedCustomer = {
                        maKhachHang: customerCode,
                        tenKhachHang: customerName || (found?.tenKhachHang ?? ""),
                        dt: found?.dt ?? "",
                        noHienTai: finalDebt,
                        tongban: prevTongban + discountedAmount,
                    }

                    const resCust = await fetch("/api/customers", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(updatedCustomer),
                    })
                    if (resCust.ok) {
                        const updated = await resCust.json()
                        // cập nhật local state customers
                        const newCustomers = customers.map((c) => (c.maKhachHang === updated.maKhachHang ? updated : c))
                        // nếu khách hàng mới (không có trước) thì thêm
                        if (!customers.find((c) => c.maKhachHang === updated.maKhachHang)) newCustomers.unshift(updated)
                        setCustomers(newCustomers)
                    }
                }
            } catch (e) {
                console.warn("Không cập nhật được thông tin khách hàng:", e)
            }
            router.push("/invoices")
        } catch (error) {
            console.error(error)
            setIsSaving(false)
            alert("Không lưu được hóa đơn. Vui lòng thử lại.")
        }
    }

    const handleCustomerSearch = (value: string) => {
        setCustomerSearch(value)
        const found = findCustomer(value)
        if (found) {
            setCustomerCode(found.maKhachHang)
            setCustomerName(found.tenKhachHang)
            updateCurrentTabCustomer(found.maKhachHang, found.tenKhachHang)
        } else {
            const parsed = parseCustomerInput(value)
            setCustomerCode(parsed.code)
            setCustomerName(parsed.name)
            updateCurrentTabCustomer(parsed.code, parsed.name)
        }
    }

    const handleCustomerSelect = (value: string) => {
        const parsed = parseCustomerInput(value)
        const customer = customers.find((item) => item.maKhachHang === parsed.code)
        if (customer) {
            setCustomerCode(customer.maKhachHang)
            setCustomerName(customer.tenKhachHang)
            setCustomerSearch(`${customer.maKhachHang} - ${customer.tenKhachHang}`)
            updateCurrentTabCustomer(customer.maKhachHang, customer.tenKhachHang)
        } else {
            setCustomerCode(parsed.code)
            setCustomerName(parsed.name)
            setCustomerSearch(value)
            updateCurrentTabCustomer(parsed.code, parsed.name)
        }
    }

    const handleCustomerBlur = () => {
        if (!customerSearch.trim()) {
            setCustomerCode("")
            setCustomerName("")
            updateCurrentTabCustomer("", "")
            return
        }

        const found = findCustomer(customerSearch)
        if (found) {
            setCustomerCode(found.maKhachHang)
            setCustomerName(found.tenKhachHang)
            setCustomerSearch(`${found.maKhachHang} - ${found.tenKhachHang}`)
            updateCurrentTabCustomer(found.maKhachHang, found.tenKhachHang)
        } else {
            const parsed = parseCustomerInput(customerSearch)
            setCustomerCode(parsed.code)
            setCustomerName(parsed.name)
            updateCurrentTabCustomer(parsed.code, parsed.name)
        }
    }

    const customerOptions = customers
        .filter((customer) => {
            const search = customerSearch.trim().toLowerCase()
            if (!search) return true
            return customer.maKhachHang.toLowerCase().includes(search) || customer.tenKhachHang.toLowerCase().includes(search)
        })
        .map((customer) => ({
            value: `${customer.maKhachHang} - ${customer.tenKhachHang}`,
            label: `${customer.maKhachHang} - ${customer.tenKhachHang}`,
        }))

    const formatted = (value: number) => value.toLocaleString("en-US")

    const currentTab = tabs.find((t) => t.key === activeTab)
    const currentPaid = !!currentTab?.paid

    const currentCustomer = customers.find((c) => c.maKhachHang === customerCode)
    const currentCustomerDebt = currentCustomer?.noHienTai ?? 0
    const projectedDebt = useMemo(() => {
        if (customerPay >= discountedAmount) {
            const surplus = customerPay - discountedAmount
            return Math.max(0, currentCustomerDebt - surplus)
        } else {
            const remain = discountedAmount - customerPay
            return currentCustomerDebt + remain
        }
    }, [currentCustomerDebt, discountedAmount, customerPay])

    return (
        <section className={styles.payment}>
            <h3 className={styles.payment__title}>
                Kho đồ chơi Ngân Anh
                <span>{dayjs(Date()).format("DD/MM/YYYY HH:mm")}</span>
            </h3>
            <div className={styles.payment__content}>
                <div className={styles.payment__info}>
                    <span className={styles.payment__label}>Loại giá:</span>
                    <Select
                        style={{ width: "100%", fontSize: 16 }}
                        value={priceType}
                        disabled={isLocked}
                        options={[
                            { value: "giaBanSi", label: "Giá bán sỉ" },
                            { value: "giaBanLe", label: "Giá bán lẻ" },
                        ]}
                        onChange={(value) => onPriceTypeChange(value as "giaBanSi" | "giaBanLe")}
                    />
                </div>

                <div className={styles.payment__info}>
                    <span className={styles.payment__label}>Mã khách hàng:</span>
                    <AutoComplete
                        className={styles.payment__input}
                        placeholder="Tìm mã hoặc tên khách hàng"
                        variant="underlined"
                        style={{ width: "100%" }}
                        disabled={isLocked}
                        options={customerOptions}
                        value={customerSearch}
                        onSearch={handleCustomerSearch}
                        onSelect={handleCustomerSelect}
                        onChange={(value) => setCustomerSearch(value)}
                        onBlur={handleCustomerBlur}
                    />
                </div>

                <div className={styles.payment__info}>
                    <span className={styles.payment__label}>Tên KH:</span>
                    <span>{customerName || "Chưa chọn"}</span>
                </div>

                <div className={styles.payment__info}>
                    <span className={styles.payment__label}>Tổng tiền hàng:</span>
                    <span>{formatted(totalAmount)}</span>
                </div>

                <div className={styles.payment__info}>
                    <span className={styles.payment__label}>Chiết khấu:</span>
                    <InputNumber
                        className={styles.payment__input}
                        suffix="%"
                        variant="underlined"
                        min={0}
                        max={100}
                        value={discount}
                        disabled={isLocked}
                        onChange={(value) => setDiscount(value || 0)}
                    />
                </div>

                <div className={styles.payment__info}>
                    <span className={styles.payment__label}>Khách cần trả:</span>
                    <span>{formatted(discountedAmount)}</span>
                </div>

                <div className={styles.payment__info}>
                    <span className={styles.payment__label}>Khách thanh toán:</span>
                    <InputNumber
                        className={styles.payment__input}
                        formatter={formatter}
                        parser={parseMoney}
                        variant="underlined"
                        value={customerPay}
                        disabled={isLocked}
                        onChange={(value) => {
                            setCustomerPayEdited(true)
                            setCustomerPay(value ?? 0)
                        }}
                    />
                </div>

                <div className={styles.payment__info}>
                    <span className={styles.payment__label}>Khách còn thiếu:</span>
                    <span>{formatted(Math.max(0, -change))}</span>
                </div>

                <div className={styles.payment__info}>
                    <span className={styles.payment__label}>Nợ hiện tại:</span>
                    <span>{formatted(projectedDebt)}</span>
                </div>

                <div className={styles.payment__info}>
                    <Radio.Group
                        className={styles.payment__radio}
                        value={paymentMethod}
                        disabled={isLocked}
                        onChange={(e) => {
                            setPaymentMethod(e.target.value)
                            updateCurrentTabFields({ paymentMethod: e.target.value })
                        }}
                        options={[
                            { value: "tienMat", label: "Tiền mặt" },
                            { value: "chuyenKhoan", label: "Chuyển khoản" },
                        ]}
                    />
                </div>
            </div>

            <div className={styles.payment__btns}>
                <Button color="danger" variant="dashed" size="large" onClick={handlePreview} disabled={isLocked}>
                    Xem hóa đơn
                </Button>
                <Button color="danger" variant="dashed" size="large" onClick={handlePrintInvoice} disabled={isLocked}>
                    In hóa đơn
                </Button>
                <Button color={isLocked ? "default" : "green"} variant="dashed" size="large" style={{ width: "120px" }} onClick={onToggleLock}>
                    {isLocked ? "Mở" : "Khóa"} HĐ
                </Button>
                <Button
                    color={currentPaid ? "default" : "primary"}
                    variant="solid"
                    size="large"
                    style={{ width: "calc(100% - 132px)" }}
                    onClick={handlePay}
                    disabled={isLocked}
                    // disabled={isSaving || currentPaid}
                    loading={isSaving}
                >
                    {currentPaid ? "Đã thanh toán" : "Thanh toán"}
                </Button>
            </div>

            <Modal
                title="Xem trước hóa đơn"
                open={previewVisible}
                onCancel={() => setPreviewVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setPreviewVisible(false)}>
                        Đóng
                    </Button>,
                    <Button key="print" type="primary" onClick={handlePrintInvoice} disabled={isLocked}>
                        In hóa đơn
                    </Button>,
                ]}
                width={860}
            >
                <div style={{ fontFamily: "Arial, sans-serif", color: "#222" }}>
                    <div style={{ textAlign: "center", marginBottom: 16 }}>
                        <h2 style={{ margin: 0, fontSize: 22, textAlign: "center" }}>KHO ĐỒ CHƠI LÊ MINH</h2>
                        <p style={{ margin: 2, fontSize: 13 }}>30 HT43 Nguyễn Anh Thủ, P. Hiệp Thành, Quận 12, HCM</p>
                        <p style={{ margin: 2, fontSize: 13 }}>ĐT: 032 656 3839 - 033 547 2908</p>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                        <div>
                            <div style={{ fontWeight: 700, marginBottom: 8 }}>HÓA ĐƠN BÁN HÀNG</div>
                            <div>Số hóa đơn: {getInvoiceNumber(`${Date.now()}`)}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div>Ngày: {dayjs().format("DD/MM/YYYY HH:mm")}</div>
                            <div>Phương thức: {paymentMethod === "tienMat" ? "Tiền mặt" : "Chuyển khoản"}</div>
                        </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                        <div>
                            <div style={{ fontWeight: 700 }}>Khách hàng</div>
                            <div>{customerName || "-"}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 700 }}>Mã KH</div>
                            <div>{customerCode || "-"}</div>
                        </div>
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                            <tr>
                                <th style={{ border: "1px solid #444", padding: 8 }}>STT</th>
                                <th style={{ border: "1px solid #444", padding: 8 }}>Tên hàng</th>
                                <th style={{ border: "1px solid #444", padding: 8 }}>ĐVT</th>
                                <th style={{ border: "1px solid #444", padding: 8 }}>Số lượng</th>
                                <th style={{ border: "1px solid #444", padding: 8 }}>Đơn giá</th>
                                <th style={{ border: "1px solid #444", padding: 8 }}>Thành tiền</th>
                                <th style={{ border: "1px solid #444", padding: 8 }}>Ghi chú</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={item.product.id}>
                                    <td style={{ border: "1px solid #444", padding: 8, textAlign: "center" }}>{idx + 1}</td>
                                    <td style={{ border: "1px solid #444", padding: 8 }}>{item.product.tenHang}</td>
                                    <td style={{ border: "1px solid #444", padding: 8, textAlign: "center" }}>Cái</td>
                                    <td style={{ border: "1px solid #444", padding: 8, textAlign: "center" }}>{item.quantity}</td>
                                    <td style={{ border: "1px solid #444", padding: 8, textAlign: "right" }}>{formatted(getItemPrice(item))}</td>
                                    <td style={{ border: "1px solid #444", padding: 8, textAlign: "right" }}>
                                        {formatted(getItemPrice(item) * item.quantity)}
                                    </td>
                                    <td style={{ border: "1px solid #444", padding: 8 }}>{item.note ?? ""}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={3} style={{ padding: 8, textAlign: "right" }}>
                                    Tổng số lượng:
                                </td>
                                <td style={{ padding: 8, textAlign: "center" }}>{totalQuantity}</td>
                                <td style={{ padding: 8, textAlign: "right" }}></td>
                                <td style={{ padding: 8, textAlign: "right" }}>{formatted(totalAmount)}</td>
                                <td style={{ padding: 8 }}></td>
                            </tr>
                            <tr>
                                <td colSpan={3} style={{ padding: 8, textAlign: "right" }}>
                                    Chiết khấu:
                                </td>
                                <td style={{ padding: 8 }}></td>
                                <td style={{ padding: 8 }}></td>
                                <td style={{ padding: 8, textAlign: "right" }}>{discount}%</td>
                                <td style={{ padding: 8 }}></td>
                            </tr>
                            <tr>
                                <td colSpan={3} style={{ padding: 8, textAlign: "right" }}>
                                    Khách thanh toán:
                                </td>
                                <td style={{ padding: 8 }}></td>
                                <td style={{ padding: 8 }}></td>
                                <td style={{ padding: 8, textAlign: "right" }}>{formatted(customerPay)}</td>
                                <td style={{ padding: 8 }}></td>
                            </tr>
                            <tr>
                                <td colSpan={3} style={{ padding: 8, textAlign: "right" }}>
                                    Nợ cũ:
                                </td>
                                <td style={{ padding: 8 }}></td>
                                <td style={{ padding: 8 }}></td>
                                <td style={{ padding: 8, textAlign: "right" }}>{formatted(currentCustomerDebt)}</td>
                                <td style={{ padding: 8 }}></td>
                            </tr>
                            <tr>
                                <td colSpan={3} style={{ padding: 8, textAlign: "right" }}>
                                    Nợ còn lại:
                                </td>
                                <td style={{ padding: 8 }}></td>
                                <td style={{ padding: 8 }}></td>
                                <td style={{ padding: 8, textAlign: "right" }}>{formatted(projectedDebt)}</td>
                                <td style={{ padding: 8 }}></td>
                            </tr>
                        </tfoot>
                    </table>
                    <div style={{ marginTop: 12, fontStyle: "italic", textAlign: "right" }}>
                        Tổng thanh toán bằng chữ: {numberToVietnameseWords(discountedAmount)}
                    </div>
                    <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                        <div>
                            <div>Người mua hàng</div>
                            <br />
                            <p>...................................</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div>
                                Ngày {dayjs().format("DD")} tháng {dayjs().format("MM")} năm {dayjs().format("YYYY")}
                            </div>
                            <div>Người bán hàng</div>
                            <br />
                            <p>...................................</p>
                        </div>
                    </div>
                </div>
            </Modal>
        </section>
    )
}

export default PaymentSide
