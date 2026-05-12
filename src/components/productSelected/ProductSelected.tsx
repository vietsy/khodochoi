"use client"
import type { InputNumberProps } from "antd"
import { Button, InputNumber } from "antd"
import { DeleteOutlined } from "@ant-design/icons"
import { ProductType } from "@/types/product"
import styles from "@/components/productSelected/styles/ProductSelected.module.scss"
import { useState, useEffect } from "react"

interface ProductSelectedProps {
    products: { product: ProductType; quantity: number }[]
    onUpdate: (products: { product: ProductType; quantity: number }[]) => void
}

const formatter: InputNumberProps<number>["formatter"] = (value) => {
    const [start, end] = `${value}`.split(".") || []
    const v = `${start}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    return `${end ? `${v}.${end}` : `${v}`}`
}

const ProductSelected = ({ products, onUpdate }: ProductSelectedProps) => {
    const [items, setItems] = useState(products)

    // đồng bộ khi props products thay đổi
    useEffect(() => {
        setItems(products)
    }, [products])

    const updateItems = (newItems: { product: ProductType; quantity: number }[]) => {
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

    const total = (quantity: number, giaBan?: number) => {
        if (!giaBan) return "0"
        return (quantity * giaBan).toLocaleString("vi-VN").replace(/\./g, ",")
    }

    return (
        <ul className={styles.products}>
            {items.map((item, index) => (
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
                        <InputNumber min={1} value={item.quantity} onChange={(val) => handleQuantityChange(index, val)} />
                    </span>
                    <span className={styles.products__col}>
                        <InputNumber value={item.product.giaBan} formatter={formatter} parser={(val) => val?.replace(/\,/g, "") as unknown as number} />
                    </span>
                    <span className={styles.products__col}>{total(item.quantity, item.product.giaBan)}</span>
                </li>
            ))}
        </ul>
    )
}

export default ProductSelected
