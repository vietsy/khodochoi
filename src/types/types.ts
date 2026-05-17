export type ProductType = {
    id: string
    maHang: string
    tenHang: string
    nhomHang: string
    giaVon?: number
    giaBanSi?: number
    giaBanLe?: number
    tonKho?: number
    thoiGianTao?: string
}

export type CustomerType = {
    maKhachHang: string
    tenKhachHang: string
    dt: string
    noHienTai: number
    tongban: number
}

export type Tab = {
    key: string
    title: string
    products: { product: ProductType; quantity: number; note?: string }[]
    customerCode?: string
    customerName?: string
    paid?: boolean
    priceType?: "giaBanSi" | "giaBanLe"
    paymentMethod?: string
}
