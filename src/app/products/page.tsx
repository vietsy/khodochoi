"use client"
import { ChangeEvent, useEffect, useState } from "react"
import { Table, Button, Input, Space } from "antd"
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons"
import type { TableColumnsType } from "antd"
import ProductModal from "@/components/productModal/ProductModal"
import styles from "@/styles/products.module.scss"
import { PRODUCTS_KEY } from "@/constand/constand"
import { ProductType } from "@/types/product"
import Menu from "@/components/menu"

const ProductsPage = () => {
    const [showModal, setShowModal] = useState<boolean>(false)
    const [searchInput, setSearchInput] = useState<string>("")
    const [products, setProducts] = useState<ProductType[]>([])
    const [editId, setEditId] = useState<string | null>(null)

    // Lấy dữ liệu từ localStorage khi mount
    useEffect(() => {
        const stored = localStorage.getItem(PRODUCTS_KEY)
        if (stored) {
            const parsed = JSON.parse(stored)
            // thêm key để Table nhận diện
            const withKeys = parsed.map((item: ProductType, index: number) => ({
                ...item,
                key: index,
            }))
            setProducts(withKeys)
        }
    }, [showModal])

    // Lọc theo searchInput
    const filteredProducts = products.filter(
        (p) => p.maHang?.toLowerCase().includes(searchInput.toLowerCase()) || p.tenHang?.toLowerCase().includes(searchInput.toLowerCase())
    )

    const handleSearch = (e: ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
        setSearchInput(e.target.value)
    }

    const handleEdit = (id: string) => {
        setEditId(id)
        setShowModal(true)
    }

    const handleDelete = (id: string) => {
        const stored = localStorage.getItem(PRODUCTS_KEY)
        if (stored) {
            const products = JSON.parse(stored)
            const newProducts = products.filter((p: ProductType) => p.id !== id)
            localStorage.setItem(PRODUCTS_KEY, JSON.stringify(newProducts))
            setProducts(newProducts.map((item: ProductType, index: number) => ({ ...item, key: index })))
        }
    }

    const columns: TableColumnsType<ProductType> = [
        {
            title: "",
            key: "action",
            render: (_, record) => (
                <Space>
                    <Button color="primary" variant="solid" onClick={() => handleEdit(record.id)}>
                        <EditOutlined />
                    </Button>
                    <Button color="danger" variant="outlined" onClick={() => handleDelete(record.id)}>
                        <DeleteOutlined />
                    </Button>
                </Space>
            ),
            width: "100px",
        },
        { title: "Mã hàng", dataIndex: "maHang", key: "maHang" },
        { title: "Tên hàng", dataIndex: "tenHang", key: "tenHang" },
        { title: "Giá bán", dataIndex: "giaBan", key: "giaBan" },
        { title: "Giá vốn", dataIndex: "giaVon", key: "giaVon" },
        { title: "Số lượng", dataIndex: "tonKho", key: "tonKho" },
        { title: "Thời gian tạo", dataIndex: "thoiGianTao", key: "thoiGianTao" },
    ]

    const handleShowModal = () => {
        setShowModal(true)
    }

    return (
        <>
            {showModal && <ProductModal closeModal={setShowModal} editId={editId} setEditId={() => setEditId(null)} />}
            <Menu />
            <main className={styles.products}>
                <div className={styles.products__head}>
                    <Input
                        name="search"
                        value={searchInput}
                        size="large"
                        placeholder="Theo mã, tên hàng"
                        prefix={<SearchOutlined />}
                        onChange={(e) => handleSearch(e)}
                    />
                    <Button type="primary" size="large" onClick={handleShowModal}>
                        <PlusOutlined />
                        Tạo mới
                    </Button>
                </div>
                <Table dataSource={filteredProducts} columns={columns} className={styles.table} pagination={{ pageSize: 30 }} />;
            </main>
        </>
    )
}

export default ProductsPage
