"use client"
import { ChangeEvent, useCallback, useEffect, useState } from "react"
import { Table, Button, Input } from "antd"
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons"
import type { TableColumnsType } from "antd"
import ProductModal from "@/components/productModal/ProductModal"
import styles from "@/styles/products.module.scss"
import { ProductType } from "@/types/types"
import Menu from "@/components/menu"

const ProductsPage = () => {
    const [showModal, setShowModal] = useState<boolean>(false)
    const [searchInput, setSearchInput] = useState<string>("")
    const [products, setProducts] = useState<ProductType[]>([])
    const [editId, setEditId] = useState<string | null>(null)

    const fetchProducts = useCallback(async () => {
        try {
            const response = await fetch("/api/products")
            if (!response.ok) {
                throw new Error("Không thể tải danh sách sản phẩm")
            }
            const productsData = await response.json()
            const withKeys = productsData.map((item: ProductType, index: number) => ({
                ...item,
                key: index,
            }))
            setProducts(withKeys)
        } catch (error) {
            console.error(error)
        }
    }, [])

    useEffect(() => {
        fetchProducts()
    }, [fetchProducts])

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

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/products?id=${id}`, {
                method: "DELETE",
            })
            if (!response.ok) {
                throw new Error("Xóa sản phẩm thất bại")
            }
            setProducts((current) => current.filter((item) => item.id !== id))
        } catch (error) {
            console.error(error)
        }
    }

    const columns: TableColumnsType<ProductType> = [
        {
            title: "",
            key: "action",
            render: (_, record) => (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <Button color="primary" variant="solid" onClick={() => handleEdit(record.id)}>
                        <EditOutlined />
                    </Button>
                    <Button color="danger" variant="outlined" onClick={() => handleDelete(record.id)}>
                        <DeleteOutlined />
                    </Button>
                </div>
            ),
            width: "80px",
        },
        { title: "Mã hàng", dataIndex: "maHang", key: "maHang", ellipsis: true },
        { title: "Tên hàng", dataIndex: "tenHang", key: "tenHang", ellipsis: true },
        { title: "Giá vốn", dataIndex: "giaVon", key: "giaVon", ellipsis: true, render: (v) => (v ? v.toLocaleString("en-US") : 0) },
        { title: "Giá bán sỉ", dataIndex: "giaBanSi", key: "giaBanSi", ellipsis: true, render: (v) => (v ? v.toLocaleString("en-US") : 0) },
        { title: "Giá bán lẻ", dataIndex: "giaBanLe", key: "giaBanLe", ellipsis: true, render: (v) => (v ? v.toLocaleString("en-US") : 0) },
        { title: "Số lượng", dataIndex: "tonKho", key: "tonKho", width: "120px" },
        { title: "Thời gian tạo", dataIndex: "thoiGianTao", key: "thoiGianTao", width: "120px" },
    ]

    const handleShowModal = () => {
        setShowModal(true)
    }

    return (
        <>
            {showModal && <ProductModal closeModal={setShowModal} editId={editId} setEditId={() => setEditId(null)} onSaved={fetchProducts} />}
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
                <Table dataSource={filteredProducts} columns={columns} className={styles.table} pagination={{ pageSize: 20 }} />
            </main>
        </>
    )
}

export default ProductsPage
