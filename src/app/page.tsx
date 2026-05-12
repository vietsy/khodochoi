"use client"
import { ChangeEvent, useEffect, useRef, useState } from "react"
import { Button, Input } from "antd"
import { CloseOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons"

import styles from "@/styles/invoice.module.scss"
import PaymentSide from "@/components/paymentSide/PaymentSide"
import ProductSelected from "@/components/productSelected/ProductSelected"
import { PRODUCTS_KEY } from "@/constand/constand"
import { ProductType } from "@/types/product"
import Menu from "@/components/menu"

interface Tab {
    key: string
    title: string
    products: { product: ProductType; quantity: number }[]
}

const STORAGE_KEY = "INVOICES"

const InvoicePage = () => {
    const [searchInput, setSearchInput] = useState("")
    const [tabs, setTabs] = useState<Tab[]>([])
    const [activeTab, setActiveTab] = useState("")
    const [allProducts, setAllProducts] = useState<ProductType[]>([])
    const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null)
    const [quantity, setQuantity] = useState<number>(1)

    const quantityRef = useRef<any>(null)

    // Load sản phẩm từ localStorage
    useEffect(() => {
        const stored = localStorage.getItem(PRODUCTS_KEY)
        if (stored) setAllProducts(JSON.parse(stored))
    }, [])

    // Load hóa đơn từ localStorage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            const parsed: Tab[] = JSON.parse(stored)
            // đảm bảo mỗi tab đều có products là mảng
            const normalized = parsed.map((tab) => ({
                ...tab,
                products: Array.isArray(tab.products) ? tab.products : [],
            }))
            setTabs(normalized)
            if (normalized.length > 0) setActiveTab(normalized[0].key)
        } else {
            const defaultTab: Tab = { key: "1", title: "Hóa đơn 1", products: [] }
            setTabs([defaultTab])
            setActiveTab("1")
            localStorage.setItem(STORAGE_KEY, JSON.stringify([defaultTab]))
        }
    }, [])

    const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchInput(e.target.value)
        setSelectedProduct(null)
    }

    const handleAddTab = () => {
        const newKey = `${Date.now()}`
        const newTab: Tab = { key: newKey, title: `Hóa đơn ${tabs.length + 1}`, products: [] } // thêm products: []
        const newTabs = [...tabs, newTab]
        setTabs(newTabs)
        setActiveTab(newKey)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newTabs))
    }

    const handleRemoveTab = (key: string) => {
        const newTabs = tabs.filter((tab) => tab.key !== key)
        setTabs(newTabs)
        if (activeTab === key && newTabs.length > 0) {
            setActiveTab(newTabs[0].key)
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newTabs))
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
        if (!selectedProduct) return

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

        // cập nhật state ngay lập tức
        setTabs(newTabs)
        // ghi xuống localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newTabs))

        // reset input
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
                                    <p className={styles.suggest__price}>{item.giaBan?.toLocaleString("vi-VN").replace(/\./g, ",")}</p>
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
                            onUpdate={(updatedProducts) => {
                                const newTabs = tabs.map((t) => (t.key === activeTab ? { ...t, products: updatedProducts } : t))
                                setTabs(newTabs)
                                localStorage.setItem("INVOICES", JSON.stringify(newTabs))
                            }}
                        />
                        <PaymentSide products={tab.products} activeTab={activeTab} tabs={tabs} setTabs={setTabs} />
                    </div>
                ))}
            </main>
        </>
    )
}

export default InvoicePage
