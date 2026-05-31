"use client"
import { Button, Input, InputNumber } from "antd"
import { DeleteOutlined } from "@ant-design/icons"
import { ProductType } from "@/types/types"
import styles from "@/components/productSelected/styles/ProductSelected.module.scss"
import { useEffect, useState } from "react"
import { formatter, parseMoney } from "@/ultils/format"

interface ProductItem {
    product: ProductType
    quantity: number
    note?: string
    unitPrice?: number
}

interface ProductSelectedProps {
    products: ProductItem[]
    priceType: "giaBanSi" | "giaBanLe"
    locked?: boolean
    onUpdate: (products: ProductItem[]) => void
}

const ProductSelected = ({ products, priceType, locked = false, onUpdate }: ProductSelectedProps) => {
    const [items, setItems] = useState<ProductItem[]>(products)

    useEffect(() => {
        setItems(products)
    }, [products])

    const updateItems = (newItems: ProductItem[]) => {
        setItems(newItems)
        onUpdate(newItems)
    }

    const handleQuantityChange = (index: number, value: number | null) => {
        if (locked) return
        const newItems = [...items]
        newItems[index].quantity = value ?? 0
        updateItems(newItems)
    }

    const handleDelete = (index: number) => {
        if (locked) return
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
                                disabled={locked}
                            />
                            {index + 1}
                        </span>
                        <span className={styles.products__col}>
                            <span className={styles.products__label}>Mã Hàng: </span>
                            {item.product.maHang}
                        </span>
                        <span className={styles.products__col}>
                            <span className={styles.products__label}>Tên Hàng: </span>
                            {item.product.tenHang}
                        </span>
                        <span className={styles.products__col}>
                            <span className={styles.products__label}>Số Lượng: </span>
                            <InputNumber
                                variant="underlined"
                                min={1}
                                value={item.quantity}
                                onChange={(val) => handleQuantityChange(index, val)}
                                disabled={locked}
                            />
                        </span>
                        <span className={styles.products__col}>
                            <span className={styles.products__label}>Đơn Giá: </span>
                            <InputNumber
                                variant="underlined"
                                value={price}
                                formatter={formatter}
                                parser={parseMoney}
                                onChange={(val) => {
                                    if (locked) return
                                    const newItems = [...items]
                                    newItems[index] = { ...newItems[index], unitPrice: val ?? 0 }
                                    updateItems(newItems)
                                }}
                                disabled={locked}
                            />
                        </span>
                        <span className={`${styles.products__col} ${styles.products__total}`}>
                            <span className={styles.products__label}>Tổng: </span>
                            {total(item.quantity, price)}
                        </span>
                        <div className={styles.products__note}>
                            <span>Ghi chú: </span>
                            <Input
                                value={item.note ?? ""}
                                onChange={(e) => {
                                    if (locked) return
                                    const newItems = [...items]
                                    newItems[index] = { ...newItems[index], note: e.target.value }
                                    updateItems(newItems)
                                }}
                                disabled={locked}
                            />
                        </div>
                    </li>
                )
            })}
        </ul>
    )
}

export default ProductSelected
