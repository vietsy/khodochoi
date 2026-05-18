"use client"
import { ChangeEvent, useCallback, useEffect, useState } from "react"
import { Table, Button, Input, Modal, Form, InputNumber, message } from "antd"
import { PlusOutlined, SearchOutlined, DeleteOutlined } from "@ant-design/icons"
import type { TableColumnsType } from "antd"
import styles from "@/styles/products.module.scss"
import Menu from "@/components/menu"
import { formatter } from "@/ultils/format"
import { CustomerType } from "@/types/types"

const Customers = () => {
    const [showModal, setShowModal] = useState<boolean>(false)
    const [searchInput, setSearchInput] = useState<string>("")
    const [customers, setCustomers] = useState<CustomerType[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [form] = Form.useForm()

    const fetchCustomers = useCallback(async () => {
        try {
            setLoading(true)
            const response = await fetch("/api/customers")
            if (!response.ok) {
                throw new Error("Không thể tải danh sách khách hàng")
            }
            const customersData = await response.json()
            setCustomers(customersData)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchCustomers()
    }, [fetchCustomers])

    const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchInput(e.target.value)
    }

    const columns: TableColumnsType<CustomerType> = [
        { title: "Mã khách hàng", dataIndex: "maKhachHang", key: "maKhachHang", ellipsis: true },
        { title: "Tên khách hàng", dataIndex: "tenKhachHang", key: "tenKhachHang", ellipsis: true },
        { title: "Điện thoại", dataIndex: "dt", key: "dt", ellipsis: true },
        { title: "Nợ hiện tại", dataIndex: "noHienTai", key: "noHienTai", render: (v) => (v ? v.toLocaleString("en-US") : 0), ellipsis: true },
        { title: "Tổng bán", dataIndex: "tongban", key: "tongban", render: (v) => (v ? v.toLocaleString("en-US") : 0), ellipsis: true },
        {
            title: "Thao tác",
            key: "actions",
            width: 120,
            render: (_: any, record: CustomerType) => (
                <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => {
                        Modal.confirm({
                            title: "Xóa khách hàng",
                            content: `Bạn có chắc chắn muốn xóa khách hàng "${record.tenKhachHang}" (${record.maKhachHang})?`,
                            okText: "Xóa",
                            cancelText: "Hủy",
                            okButtonProps: { danger: true },
                            onOk: async () => {
                                try {
                                    console.log("Deleting customer:", record.maKhachHang)
                                    const res = await fetch(`/api/customers/${record.maKhachHang}`, {
                                        method: "DELETE",
                                    })
                                    const data = await res.json()
                                    console.log("Delete response:", data, "Status:", res.status)

                                    if (!res.ok) {
                                        throw new Error(data?.error || "Không thể xóa khách hàng")
                                    }

                                    setCustomers(customers.filter((c) => c.maKhachHang !== record.maKhachHang))
                                    message.success("Xóa khách hàng thành công")
                                } catch (err: any) {
                                    console.error("Delete error:", err)
                                    message.error(err.message || "Xóa khách hàng thất bại")
                                }
                            },
                        })
                    }}
                >
                    Xóa
                </Button>
            ),
        },
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

    const handleSaveCustomer = async () => {
        try {
            const values = (await form.validateFields()) as CustomerType
            const newCustomer: CustomerType = {
                ...values,
                noHienTai: values.noHienTai || 0,
                tongban: values.tongban || 0,
            }

            const response = await fetch("/api/customers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newCustomer),
            })

            if (!response.ok) {
                const errorBody = await response.json().catch(() => null)
                throw new Error(errorBody?.message || "Lưu khách hàng thất bại")
            }

            const savedCustomer = await response.json()
            setCustomers((current) => [...current, savedCustomer])
            setShowModal(false)
        } catch (error) {
            console.error(error)
        }
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

                <Table
                    dataSource={filteredCustomers}
                    columns={columns}
                    className={styles.table}
                    pagination={{ pageSize: 30 }}
                    rowKey="maKhachHang"
                    loading={loading}
                />

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
