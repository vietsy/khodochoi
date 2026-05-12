"use client"
import { ChangeEvent, useEffect, useState } from "react"
import { Table, Button, Input, Modal, Form, InputNumber } from "antd"
import { PlusOutlined, SearchOutlined } from "@ant-design/icons"
import type { InputNumberProps, TableColumnsType } from "antd"
import styles from "@/styles/products.module.scss"
import Menu from "@/components/menu"

interface CustomerType {
    maKhachHang: string
    tenKhachHang: string
    dt: string
    noHienTai: number
    tongban: number
}

const STORAGE_KEY = "CUSTOMERS"

const formatter: InputNumberProps<number>["formatter"] = (value) => {
    const [start, end] = `${value}`.split(".") || []
    const v = `${start}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    return `${end ? `${v}.${end}` : `${v}`}`
}

const Customers = () => {
    const [showModal, setShowModal] = useState<boolean>(false)
    const [searchInput, setSearchInput] = useState<string>("")
    const [customers, setCustomers] = useState<CustomerType[]>([])
    const [form] = Form.useForm()

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            setCustomers(JSON.parse(stored))
        }
    }, [])

    const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchInput(e.target.value)
    }

    const columns: TableColumnsType<CustomerType> = [
        { title: "Mã khách hàng", dataIndex: "maKhachHang", key: "maKhachHang" },
        { title: "Tên khách hàng", dataIndex: "tenKhachHang", key: "tenKhachHang" },
        { title: "Điện thoại", dataIndex: "dt", key: "dt" },
        { title: "Nợ hiện tại", dataIndex: "noHienTai", key: "noHienTai" },
        { title: "Tổng bán", dataIndex: "tongban", key: "tongban" },
    ]

    const handleShowModal = () => {
        // Sinh mã khách hàng mới
        const nextIndex = customers.length + 1
        const maKhachHang = `KH${String(nextIndex).padStart(6, "0")}`

        form.setFieldsValue({
            maKhachHang,
            tenKhachHang: "",
            dt: "",
            noHienTai: 0,
            tongban: 0,
        })

        setShowModal(true)
    }

    const handleSaveCustomer = () => {
        form.validateFields().then((values: CustomerType) => {
            const newCustomer: CustomerType = {
                ...values,
                noHienTai: values.noHienTai || 0,
                tongban: values.tongban || 0,
            }
            const updated = [...customers, newCustomer]
            setCustomers(updated)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
            setShowModal(false)
        })
    }

    const filteredCustomers = customers.filter(
        (c) => c.tenKhachHang?.toLowerCase().includes(searchInput.toLowerCase()) || c.maKhachHang?.toLowerCase().includes(searchInput.toLowerCase())
    )

    return (
        <>
            <Menu />
            <main className={styles.products}>
                <div className={styles.products__head}>
                    <Input
                        name="search"
                        value={searchInput}
                        size="large"
                        placeholder="Theo mã, tên khách hàng"
                        prefix={<SearchOutlined />}
                        onChange={handleSearch}
                    />
                    <Button type="primary" size="large" onClick={handleShowModal}>
                        <PlusOutlined />
                        Tạo mới
                    </Button>
                </div>

                <Table dataSource={filteredCustomers} columns={columns} className={styles.table} pagination={{ pageSize: 30 }} rowKey="maKhachHang" />

                <Modal
                    title="Thêm khách hàng mới"
                    open={showModal}
                    onCancel={() => setShowModal(false)}
                    onOk={handleSaveCustomer}
                    okText="Lưu"
                    cancelText="Hủy"
                >
                    <Form form={form} layout="vertical">
                        <Form.Item label="Mã khách hàng" name="maKhachHang">
                            <Input readOnly />
                        </Form.Item>
                        <Form.Item label="Tên khách hàng" name="tenKhachHang" rules={[{ required: true, message: "Nhập tên khách hàng" }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Điện thoại" name="dt">
                            <Input />
                        </Form.Item>
                        <Form.Item label="Nợ hiện tại" name="noHienTai">
                            <InputNumber style={{ width: "100%" }} formatter={formatter} parser={(val) => val?.replace(/\,/g, "") as unknown as number} />
                        </Form.Item>
                        <Form.Item label="Tổng bán" name="tongban">
                            <InputNumber style={{ width: "100%" }} formatter={formatter} parser={(val) => val?.replace(/\,/g, "") as unknown as number} />
                        </Form.Item>
                    </Form>
                </Modal>
            </main>
        </>
    )
}

export default Customers
