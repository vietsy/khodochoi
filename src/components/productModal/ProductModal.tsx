"use client"

import { useEffect, useRef, useState } from "react"
import { Button, Divider, Form, Input, InputNumber, Select, Space, message } from "antd"
import { PlusOutlined } from "@ant-design/icons"
import type { InputRef, FormProps } from "antd"
import { nhomHangOptionsData } from "@/__mock__/nhomHang"
import styles from "@/components/productModal/styles/ProductModal.module.scss"
import { ProductType } from "@/types/types"
import { formatter, parseMoney } from "@/ultils/format"

interface ProductModalProps {
    closeModal: (value: boolean) => void
    editId?: string | null
    setEditId?: () => void
    onSaved?: () => void
}

let index = 0

const ProductModal = ({ closeModal, editId, setEditId, onSaved }: ProductModalProps) => {
    const [loading, setLoading] = useState<boolean>(false)
    const [nhomHangOptions, setNhomHangOptions] = useState<string[]>([])
    const [nhomHangName, setNhomHangName] = useState("")
    const inputRef = useRef<InputRef>(null)

    const [form] = Form.useForm()

    useEffect(() => {
        if (editId) {
            fetch(`/api/products?id=${editId}`)
                .then(async (response) => {
                    if (!response.ok) {
                        throw new Error("Không tìm thấy sản phẩm")
                    }
                    return response.json()
                })
                .then((product) => {
                    form.setFieldsValue(product)
                })
                .catch(() => {
                    message.error("Không lấy được dữ liệu sản phẩm để sửa")
                })
        } else {
            form.resetFields() // reset form khi thêm mới
        }
    }, [editId, form])

    // Lấy dữ liệu nhóm hàng từ API khi mount
    useEffect(() => {
        fetch("/api/nhom-hang")
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error("Không lấy được nhóm hàng")
                }
                return response.json()
            })
            .then((options) => {
                setNhomHangOptions(options)
            })
            .catch(() => {
                setNhomHangOptions(nhomHangOptionsData)
            })
    }, [])

    const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNhomHangName(event.target.value)
    }

    const addNhomHang = async (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
        e.preventDefault()
        const newItem = nhomHangName || `Nhóm ${index++}`

        try {
            const response = await fetch("/api/nhom-hang", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ item: newItem }),
            })
            if (!response.ok) {
                throw new Error("Không thể thêm nhóm hàng")
            }
            const updatedOptions = await response.json()
            setNhomHangOptions(updatedOptions)
            setNhomHangName("")
            setTimeout(() => {
                inputRef.current?.focus()
            }, 0)
        } catch (error) {
            message.error("Thêm nhóm hàng thất bại")
        }
    }

    const onFinish: FormProps<ProductType>["onFinish"] = async (values) => {
        setLoading(true)
        try {
            const method = editId ? "PUT" : "POST"
            const url = editId ? `/api/products?id=${editId}` : "/api/products"
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => null)
                throw new Error(errorData?.message || "Lưu sản phẩm thất bại")
            }

            if (editId) {
                setEditId && setEditId()
                message.success("Cập nhật sản phẩm thành công!")
            } else {
                message.success("Thêm sản phẩm thành công!")
            }

            form.resetFields()
            closeModal(false)
            onSaved && onSaved()
        } catch (error) {
            message.error((error as Error).message || "Có lỗi xảy ra khi tạo sản phẩm!")
        } finally {
            setLoading(false)
        }
    }

    const handleCloseModal = () => {
        closeModal(false)
        form.resetFields()
        setEditId && setEditId()
    }

    return (
        <>
            <div className={styles.modal}>
                <div className={styles.modal__inner}>
                    <h2 className={styles.modal__title}>Thêm Sản Phẩm</h2>
                    <div className={styles.modal__wrapper}>
                        <Form
                            form={form}
                            name="product-new"
                            className={styles.form}
                            initialValues={{ giaVon: 0, giaBanSi: 0, giaBanLe: 0, tonKho: 0 }}
                            onFinish={onFinish}
                        >
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
                                    <InputNumber<number> formatter={formatter} parser={parseMoney} />
                                </Form.Item>
                            </div>
                            <div className={styles.form__row}>
                                <Form.Item layout="vertical" label="Giá bán sỉ" name="giaBanSi">
                                    <InputNumber<number> formatter={formatter} parser={parseMoney} />
                                </Form.Item>
                            </div>
                            <div className={styles.form__row}>
                                <Form.Item layout="vertical" label="Giá bán lẻ" name="giaBanLe">
                                    <InputNumber<number> formatter={formatter} parser={parseMoney} />
                                </Form.Item>
                            </div>
                            <div className={styles.form__row}>
                                <Form.Item layout="vertical" label="Tồn kho" name="tonKho">
                                    <InputNumber />
                                </Form.Item>
                            </div>
                            <Space style={{ width: "100%" }}>
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
