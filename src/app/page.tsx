"use client"
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react"
import { Button, Input } from "antd"
import { CloseOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons"

import styles from "@/styles/invoice.module.scss"
import PaymentSide from "@/components/paymentSide/PaymentSide"
import ProductSelected from "@/components/productSelected/ProductSelected"
import { ProductType, Tab } from "@/types/types"
import Menu from "@/components/menu"
import dayjs from "dayjs"

const STORAGE_KEY = "INVOICES"

const InvoicePage = () => {
    const [searchInput, setSearchInput] = useState("")
    const [tabs, setTabs] = useState<Tab[]>([])
    const [activeTab, setActiveTab] = useState("")
    const [allProducts, setAllProducts] = useState<ProductType[]>([])
    const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null)
    const [quantity, setQuantity] = useState<number>(1)
    const [priceType, setPriceType] = useState<"giaBanSi" | "giaBanLe">("giaBanSi")

    const quantityRef = useRef<any>(null)

    const fetchProducts = useCallback(async () => {
        try {
            const response = await fetch("/api/products")
            if (!response.ok) {
                throw new Error("Không thể tải danh sách sản phẩm")
            }
            const productsData: ProductType[] = await response.json()
            setAllProducts(productsData)
        } catch (error) {
            console.error(error)
        }
    }, [])

    useEffect(() => {
        fetchProducts()
    }, [fetchProducts])

    const saveDrafts = async (newTabs: Tab[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newTabs))
        } catch (error) {
            console.warn("Không lưu được draft vào localStorage", error)
        }

        try {
            await fetch("/api/drafts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newTabs),
            })
        } catch (error) {
            console.error("Không lưu được bản nháp vào DB", error)
        }
    }

    // Load draft hóa đơn từ DB, fallback localStorage nếu cần
    useEffect(() => {
        const loadDrafts = async () => {
            try {
                const response = await fetch("/api/drafts")
                if (!response.ok) throw new Error("Không lấy được bản nháp từ DB")
                const data: Tab[] = await response.json()
                if (Array.isArray(data) && data.length > 0) {
                    const normalized = data.map((tab) => ({
                        ...tab,
                        products: Array.isArray(tab.products) ? tab.products : [],
                        customerCode: tab.customerCode ?? "",
                        customerName: tab.customerName ?? "",
                        paid: tab.paid ?? false,
                        priceType: tab.priceType ?? priceType,
                        paymentMethod: tab.paymentMethod ?? "tienMat",
                    }))
                    setTabs(normalized)
                    setActiveTab(normalized[0].key)
                    return
                }
            } catch (error) {
                console.error(error)
            }

            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) {
                const parsed: Tab[] = JSON.parse(stored)
                const normalized = parsed.map((tab) => ({
                    ...tab,
                    products: Array.isArray(tab.products) ? tab.products : [],
                    customerCode: tab.customerCode ?? "",
                    customerName: tab.customerName ?? "",
                    paid: tab.paid ?? false,
                    priceType: tab.priceType ?? priceType,
                    paymentMethod: tab.paymentMethod ?? "tienMat",
                }))
                setTabs(normalized)
                if (normalized.length > 0) setActiveTab(normalized[0].key)
                return
            }

            const defaultTab: Tab = {
                key: "1",
                title: "Hóa đơn 1",
                products: [],
                customerCode: "",
                customerName: "",
                paid: false,
                priceType: priceType,
                paymentMethod: "tienMat",
            }
            setTabs([defaultTab])
            setActiveTab("1")
            saveDrafts([defaultTab])
        }

        loadDrafts()
    }, [])

    // sync global priceType when active tab changes
    useEffect(() => {
        const current = tabs.find((t) => t.key === activeTab)
        if (current && current.priceType) setPriceType(current.priceType)
    }, [activeTab, tabs])

    const handlePriceTypeChange = (newType: "giaBanSi" | "giaBanLe") => {
        setPriceType(newType)
        const newTabs = tabs.map((t) => (t.key === activeTab ? { ...t, priceType: newType } : t))
        setTabs(newTabs)
        saveDrafts(newTabs)
    }

    const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchInput(e.target.value)
        setSelectedProduct(null)
    }

    const handleAddTab = () => {
        const newKey = `${Date.now()}`
        const newTab: Tab = {
            key: newKey,
            title: `HĐ ${dayjs().format("HH:mmss")}`,
            products: [],
            customerCode: "",
            customerName: "",
            paid: false,
            priceType: priceType,
            paymentMethod: "tienMat",
        }
        const newTabs = [...tabs, newTab]
        setTabs(newTabs)
        setActiveTab(newKey)
        saveDrafts(newTabs)
    }

    const handleRemoveTab = (key: string) => {
        let newTabs = tabs.filter((tab) => tab.key !== key)

        if (newTabs.length === 0) {
            const defaultTab: Tab = { key: "1", title: "Hóa đơn 1", products: [] }
            newTabs = [defaultTab]
            setActiveTab(defaultTab.key)
        } else {
            setActiveTab(newTabs[0].key)
        }

        setTabs(newTabs)
        saveDrafts(newTabs)
    }

    // Khi chọn sản phẩm từ suggest
    const handleSelectProduct = (product: ProductType) => {
        setSelectedProduct(product)
        setSearchInput(product.tenHang) // hiển thị tên sản phẩm trong ô search
        setTimeout(() => {
            quantityRef.current?.focus() // chuyển focus sang input số lượng
        }, 0)
    }

    // Khi Enter số lượng
    const handleQuantityEnter = () => {
        if (!selectedProduct || quantity <= 0) return

        const newTabs = tabs.map((tab) => {
            if (tab.key === activeTab) {
                // kiểm tra nếu sản phẩm đã tồn tại thì cộng dồn số lượng
                const existingIndex = tab.products.findIndex((p) => p.product.id === selectedProduct.id)
                let updatedProducts
                if (existingIndex >= 0) {
                    updatedProducts = [...tab.products]
                    updatedProducts[existingIndex].quantity += quantity
                } else {
                    updatedProducts = [...tab.products, { product: selectedProduct, quantity }]
                }
                return { ...tab, products: updatedProducts }
            }
            return tab
        })

        setTabs(newTabs)
        saveDrafts(newTabs)

        setSelectedProduct(null)
        setSearchInput("")
        setQuantity(1)
    }

    const filteredProducts = allProducts.filter(
        (p) => p.maHang.toLowerCase().includes(searchInput.toLowerCase()) || p.tenHang.toLowerCase().includes(searchInput.toLowerCase())
    )

    return (
        <>
            <Menu />
            <header className={styles.header}>
                <div className={styles.search}>
                    <Input
                        className={styles.search__input}
                        value={searchInput}
                        size="large"
                        placeholder="Tìm hàng hóa"
                        prefix={<SearchOutlined />}
                        onChange={handleSearch}
                    />
                    <Input
                        type="number"
                        ref={quantityRef}
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        onPressEnter={handleQuantityEnter}
                        className={styles.search__sl}
                        placeholder="Số lượng"
                        size="large"
                    />
                    {/* Suggest sản phẩm */}
                    {!selectedProduct && searchInput && (
                        <ul className={styles.suggest}>
                            {filteredProducts.map((item) => (
                                <li onClick={() => handleSelectProduct(item)} key={item.id}>
                                    <p>
                                        {item.tenHang}
                                        <span>Mã: {item.maHang}</span>
                                        <span>Tồn: {item.tonKho}</span>
                                    </p>
                                    <p className={styles.suggest__price}>{item.giaBanLe?.toLocaleString("en-US")}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className={styles.tabButtons} role="tablist">
                    {tabs.map((tab) => (
                        <span key={tab.key} onClick={() => setActiveTab(tab.key)} className={styles.tabButtons__wrap} aria-selected={activeTab === tab.key}>
                            <button type="button" className={styles.tabButtons__btn}>
                                {tab.title}
                            </button>
                            <button type="button" onClick={() => handleRemoveTab(tab.key)} className={styles.tabButtons__close}>
                                <CloseOutlined />
                            </button>
                        </span>
                    ))}
                    <Button
                        className={styles.tabButtons__add}
                        color="primary"
                        variant="outlined"
                        aria-label="Thêm hóa đơn"
                        icon={<PlusOutlined />}
                        onClick={handleAddTab}
                    />
                </div>
            </header>
            <main className={styles.invoice}>
                {tabs.map((tab) => (
                    <div key={tab.key} className={styles.tabpanel} role="tabpanel" hidden={activeTab !== tab.key}>
                        <ProductSelected
                            products={tab.products}
                            priceType={priceType}
                            onUpdate={(updatedProducts) => {
                                const newTabs = tabs.map((t) => (t.key === activeTab ? { ...t, products: updatedProducts } : t))
                                setTabs(newTabs)
                                saveDrafts(newTabs)
                            }}
                        />
                        <PaymentSide
                            products={tab.products}
                            activeTab={activeTab}
                            tabs={tabs}
                            setTabs={setTabs}
                            saveDrafts={saveDrafts}
                            priceType={priceType}
                            onPriceTypeChange={handlePriceTypeChange}
                        />
                    </div>
                ))}
            </main>
        </>
    )
}

export default InvoicePage
