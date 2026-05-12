"use client"

import { useEffect, useRef, useState } from "react"
import { Button, Divider, Form, Input, InputNumber, Select, Space, message } from "antd"
import { PlusOutlined } from "@ant-design/icons"
import type { InputRef, InputNumberProps, FormProps } from "antd"
import { nhomHangOptionsData } from "@/__mock__/nhomHang"
import styles from "@/components/productModal/styles/ProductModal.module.scss"
import { NHOM_HANG_KEY, PRODUCTS_KEY } from "@/constand/constand"
import { ProductType } from "@/types/product"

interface ProductModalProps {
    closeModal: (value: boolean) => void
    editId?: string | null
    setEditId?: () => void
}

let index = 0

const ProductModal = ({ closeModal, editId, setEditId }: ProductModalProps) => {
    const [loading, setLoading] = useState<boolean>(false)
    const [nhomHangOptions, setNhomHangOptions] = useState<string[]>([])
    const [nhomHangName, setNhomHangName] = useState("")
    const inputRef = useRef<InputRef>(null)

    const [form] = Form.useForm()

    useEffect(() => {
        if (editId) {
            const stored = localStorage.getItem(PRODUCTS_KEY)
            if (stored) {
                const products = JSON.parse(stored)
                const product = products.find((p: any) => p.id === editId)
                if (product) {
                    form.setFieldsValue(product) // set dữ liệu khi edit
                }
            }
        } else {
            form.resetFields() // reset form khi thêm mới
        }
    }, [editId, form])

    // Lấy dữ liệu từ localStorage khi mount
    useEffect(() => {
        const stored = localStorage.getItem(NHOM_HANG_KEY)
        if (stored) {
            setNhomHangOptions(JSON.parse(stored))
        } else {
            setNhomHangOptions(nhomHangOptionsData)
            localStorage.setItem(NHOM_HANG_KEY, JSON.stringify(nhomHangOptionsData))
        }
    }, [])

    const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNhomHangName(event.target.value)
    }

    const addNhomHang = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
        e.preventDefault()
        const newItem = nhomHangName || `Nhóm ${index++}`
        const newOptions = [...nhomHangOptions, newItem]
        setNhomHangOptions(newOptions)
        localStorage.setItem(NHOM_HANG_KEY, JSON.stringify(newOptions)) // cập nhật localStorage
        setNhomHangName("")
        setTimeout(() => {
            inputRef.current?.focus()
        }, 0)
    }

    const formatter: InputNumberProps<number>["formatter"] = (value) => {
        const [start, end] = `${value}`.split(".") || []
        const v = `${start}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
        return `${end ? `${v}.${end}` : `${v}`}`
    }

    const onFinish: FormProps<ProductType>["onFinish"] = (values) => {
        setLoading(true)
        try {
            const stored = localStorage.getItem(PRODUCTS_KEY)
            const products = stored ? JSON.parse(stored) : []

            if (editId) {
                // update sản phẩm
                const newProducts = products.map((p: any) => (p.id === editId ? { ...p, ...values } : p))
                localStorage.setItem(PRODUCTS_KEY, JSON.stringify(newProducts))
                setEditId && setEditId()
                message.success("Cập nhật sản phẩm thành công!")
            } else {
                // thêm mới
                const newProduct = {
                    ...values,
                    id: `${values.maHang}_${Date.now()}`,
                    thoiGianTao: new Date().toLocaleString("vi-VN"),
                }
                const newProducts = [...products, newProduct]
                localStorage.setItem(PRODUCTS_KEY, JSON.stringify(newProducts))
                message.success("Thêm sản phẩm thành công!")
            }
            closeModal(false)
        } catch (error) {
            message.error("Có lỗi xảy ra khi tạo sản phẩm!")
        } finally {
            setLoading(false)
        }
    }

    const handleCloseModal = () => {
        closeModal(false)
        form.resetFields() // reset form về trạng thái ban đầu
    }

    return (
        <>
            <div className={styles.modal}>
                <div className={styles.modal__inner}>
                    <h2 className={styles.modal__title}>Thêm Sản Phẩm</h2>
                    <div className={styles.modal__wrapper}>
                        <Form form={form} name="product-new" className={styles.form} initialValues={{ giaVon: 0, giaBan: 0, tonKho: 0 }} onFinish={onFinish}>
                            <div className={styles.form__row}>
                                <Form.Item layout="vertical" label="Mã hàng" name="maHang" rules={[{ required: true, message: "Vui lòng nhập mã hàng!" }]}>
                                    <Input />
                                </Form.Item>
                            </div>
                            <div className={styles.form__row}>
                                <Form.Item layout="vertical" label="Tên hàng" name="tenHang" rules={[{ required: true, message: "Vui lòng nhập tên hàng!" }]}>
                                    <Input />
                                </Form.Item>
                            </div>
                            <div className={styles.form__row}>
                                <Form.Item
                                    layout="vertical"
                                    label="Nhóm hàng"
                                    name="nhomHang"
                                    rules={[{ required: true, message: "Vui lòng chọn nhóm hàng!" }]}
                                >
                                    <Select
                                        showSearch={{
                                            optionFilterProp: "label",
                                            filterSort: (optionA, optionB) =>
                                                (optionA?.label ?? "").toLowerCase().localeCompare((optionB?.label ?? "").toLowerCase()),
                                        }}
                                        placeholder="Chọn nhóm hàng"
                                        popupRender={(menu) => (
                                            <>
                                                {menu}
                                                <Divider style={{ borderColor: "#a3ccff" }} plain>
                                                    Thêm Nhóm Hàng
                                                </Divider>
                                                <Space style={{ padding: "0 8px 4px" }}>
                                                    <Input
                                                        placeholder="Nhập nhóm hàng"
                                                        ref={inputRef}
                                                        value={nhomHangName}
                                                        onChange={onNameChange}
                                                        onKeyDown={(e) => e.stopPropagation()}
                                                    />
                                                    <Button type="primary" icon={<PlusOutlined />} onClick={addNhomHang} disabled={!nhomHangName}>
                                                        Thêm
                                                    </Button>
                                                </Space>
                                            </>
                                        )}
                                        options={nhomHangOptions.map((item) => ({ label: item, value: item }))}
                                    />
                                </Form.Item>
                            </div>
                            <div className={styles.form__row}>
                                <Form.Item layout="vertical" label="Giá vốn (vnđ)" name="giaVon">
                                    <InputNumber<number> formatter={formatter} parser={(value) => value?.replace(/\$\s?|(,*)/g, "") as unknown as number} />
                                </Form.Item>
                            </div>
                            <div className={styles.form__row}>
                                <Form.Item layout="vertical" label="Giá bán (vnđ)" name="giaBan">
                                    <InputNumber<number> formatter={formatter} parser={(value) => value?.replace(/\$\s?|(,*)/g, "") as unknown as number} />
                                </Form.Item>
                            </div>
                            <div className={styles.form__row}>
                                <Form.Item layout="vertical" label="Tồn kho" name="tonKho">
                                    <InputNumber />
                                </Form.Item>
                            </div>
                            <Space>
                                <Button onClick={handleCloseModal}>Đóng</Button>
                                <Button type="primary" htmlType="submit" loading={loading}>
                                    Lưu
                                </Button>
                            </Space>
                        </Form>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ProductModal
