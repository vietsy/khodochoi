"use client"
import { Button, Input, InputNumber } from "antd"
import { DeleteOutlined } from "@ant-design/icons"
import { ProductType } from "@/types/types"
import styles from "@/components/productSelected/styles/ProductSelected.module.scss"
import { useState, useEffect } from "react"
import { formatter } from "@/ultils/format"

interface ProductSelectedProps {
    products: { product: ProductType; quantity: number }[]
    priceType: "giaBanSi" | "giaBanLe"
    onUpdate: (products: { product: ProductType; quantity: number }[]) => void
}

interface ProductItem {
    product: ProductType
    quantity: number
    note?: string
    unitPrice?: number
}

interface ProductSelectedProps2 {
    products: ProductItem[]
    priceType: "giaBanSi" | "giaBanLe"
    onUpdate: (products: ProductItem[]) => void
}

const ProductSelected = ({ products, priceType, onUpdate }: ProductSelectedProps2) => {
    const [items, setItems] = useState<ProductItem[]>(products)

    // đồng bộ khi props products thay đổi
    useEffect(() => {
        // initialize unitPrice from priceType so user can edit later
        const init = products.map((p) => ({
            ...p,
            unitPrice: priceType === "giaBanSi" ? (p.product.giaBanSi ?? 0) : (p.product.giaBanLe ?? 0),
        }))
        setItems(init)
    }, [products, priceType])

    const updateItems = (newItems: ProductItem[]) => {
        setItems(newItems)
        onUpdate(newItems) // báo ngược ra InvoicePage để cập nhật state và localStorage
    }

    const handleQuantityChange = (index: number, value: number | null) => {
        const newItems = [...items]
        newItems[index].quantity = value || 0
        updateItems(newItems)
    }

    const handleDelete = (index: number) => {
        const newItems = items.filter((_, i) => i !== index)
        updateItems(newItems)
    }

    const getPrice = (product: ProductType) => {
        return priceType === "giaBanSi" ? (product.giaBanSi ?? 0) : (product.giaBanLe ?? 0)
    }

    const total = (quantity: number, price: number) => {
        if (!price) return "0"
        return (quantity * price).toLocaleString("vi-VN").replace(/\./g, ",")
    }

    return (
        <ul className={styles.products}>
            {items.map((item, index) => {
                const price = typeof item.unitPrice === "number" ? item.unitPrice : getPrice(item.product)
                return (
                    <li className={styles.products__item} key={item.product.id}>
                        <span className={styles.products__col}>
                            <Button
                                size="small"
                                color="primary"
                                variant="outlined"
                                aria-label="Delete"
                                icon={<DeleteOutlined />}
                                onClick={() => handleDelete(index)}
                            />
                            {index + 1}
                        </span>
                        <span className={styles.products__col}>{item.product.maHang}</span>
                        <span className={styles.products__col}>{item.product.tenHang}</span>
                        <span className={styles.products__col}>
                            <InputNumber variant="underlined" min={1} value={item.quantity} onChange={(val) => handleQuantityChange(index, val)} />
                        </span>
                        <span className={styles.products__col}>
                            <InputNumber
                                variant="underlined"
                                value={price}
                                formatter={formatter}
                                parser={(val) => val?.replace(/\,/g, "") as unknown as number}
                                onChange={(val) => {
                                    const newItems = [...items]
                                    newItems[index] = { ...newItems[index], unitPrice: val || 0 }
                                    updateItems(newItems)
                                }}
                            />
                        </span>
                        <span className={`${styles.products__col} ${styles.products__total}`}>{total(item.quantity, price)}</span>
                        <div className={styles.products__note}>
                            <span>Ghi chú: </span>
                            <Input
                                value={item.note ?? ""}
                                onChange={(e) => {
                                    const newItems = [...items]
                                    newItems[index] = { ...newItems[index], note: e.target.value }
                                    updateItems(newItems)
                                }}
                            />
                        </div>
                    </li>
                )
            })}
        </ul>
    )
}

export default ProductSelected
