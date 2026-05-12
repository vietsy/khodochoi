"use client"
import { Layout, Menu } from "antd"

interface LayoutCustomProps {
    children: React.ReactNode
}

const LayoutCustom = ({ children }: LayoutCustomProps) => {
    const { Header, Content, Footer } = Layout
    const items = Array.from({ length: 15 }).map((_, index) => ({
        key: index + 1,
        label: `nav ${index + 1}`,
    }))
    return (
        <>
            {children}
        </>
    )
}

export default LayoutCustom
