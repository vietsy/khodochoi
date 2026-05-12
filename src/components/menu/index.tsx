"use client"

import styles from "@/components/menu/styles/Menu.module.scss"
import Link from "next/link"

const Menu = () => {
    return (
        <div className={styles.menu}>
            <ul>
                <li>
                    <Link href="/">Hóa đơn</Link>
                </li>
                <li>
                    <Link href="/invoices">Danh sách hóa đơn</Link>
                </li>
                <li>
                    <Link href="/products">Sản phẩm</Link>
                </li>
                <li>
                    <Link href="/customers">Khách hàng</Link>
                </li>
            </ul>
        </div>
    )
}

export default Menu
