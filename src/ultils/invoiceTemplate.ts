import dayjs from "dayjs"
import { ProductType } from "@/types/types"

interface InvoiceData {
    id: string
    date: string
    customerCode: string
    customerName: string
    products: { product: ProductType; quantity: number; note?: string }[]
    totalAmount: number
    discount: number
    discountedAmount: number
    customerPay: number
    change: number
    paymentMethod: string
}

export const numberToVietnameseWords = (n: number): string => {
    if (!Number.isFinite(n)) return ""
    const number = Math.abs(Math.round(n))
    if (number === 0) return "không đồng"
    const dv = ["", "nghìn", "triệu", "tỷ"]
    const ones = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"]

    const readThree = (num: number) => {
        const a = Math.floor(num / 100)
        const b = Math.floor((num % 100) / 10)
        const c = num % 10
        let str = ""
        if (a > 0) str += ones[a] + " trăm"
        if (b > 1) {
            str += (str ? " " : "") + ones[b] + " mươi"
            if (c === 1) str += " mốt"
            else if (c === 5) str += " lăm"
            else if (c > 0) str += " " + ones[c]
        } else if (b === 1) {
            str += (str ? " " : "") + "mười"
            if (c === 1) str += " một"
            else if (c === 5) str += " lăm"
            else if (c > 0) str += " " + ones[c]
        } else if (b === 0 && c > 0) {
            if (a > 0) str += " lẻ " + ones[c]
            else str += ones[c]
        }
        return str
    }

    const parts: string[] = []
    let temp = number
    let idx = 0
    while (temp > 0) {
        const chunk = temp % 1000
        if (chunk > 0) {
            const chunkStr = readThree(chunk)
            parts.unshift(chunkStr + (dv[idx] ? " " + dv[idx] : ""))
        }
        temp = Math.floor(temp / 1000)
        idx += 1
    }
    const result = parts.join(" ").replace(/\s+/g, " ").trim()
    return result + " đồng"
}

export const getInvoiceNumber = (id: string): string => {
    return `HD${dayjs().format("YYMMDDHHmmss")}`
}

export const renderInvoiceHtml = (invoice: InvoiceData, currentCustomerDebt: number = 0): string => {
    const totalQuantity = invoice.products.reduce((sum, item) => sum + item.quantity, 0)

    const projectedDebt = (() => {
        if (invoice.customerPay >= invoice.discountedAmount) {
            const surplus = invoice.customerPay - invoice.discountedAmount
            return Math.max(0, currentCustomerDebt - surplus)
        } else {
            const remain = invoice.discountedAmount - invoice.customerPay
            return currentCustomerDebt + remain
        }
    })()

    const getPrice = (product: ProductType): number => {
        return product.giaBanLe ?? product.giaBanSi ?? 0
    }

    return `
        <html>
          <head>
            <title>Hóa đơn bán hàng</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; color: #222; }
              .header { text-align: center; margin-bottom: 20px; }
              .header h1 { margin: 0; font-size: 22px; }
              .header p { margin: 2px 0; font-size: 12px; }
              .invoice-title { margin: 22px 0 10px; font-size: 18px; font-weight: 700; text-align: center; }
              .info, .summary { width: 100%; margin-bottom: 14px; font-size: 13px; }
              .info td, .summary td { padding: 4px 6px; vertical-align: top; }
              .info th { text-align: left; padding: 4px 6px; font-weight: 700; }
              table.items { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
              table.items th, table.items td { border: 1px solid #444; padding: 6px 8px; }
              table.items th { background: #f4f4f4; }
              table.items tfoot td { font-weight: 700; border: none; }
              .footer { margin-top: 20px; display: flex; justify-content: space-between; font-size: 13px; width: 100%; }
              .footer div { width: 48%; }
              .footer strong { display: block; margin-bottom: 6px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>KHO ĐỒ CHƠI LÊ MINH</h1>
              <p>30 HT43 Nguyễn Anh Thủ, P. Hiệp Thành, Quận 12, HCM</p>
              <p>ĐT: 032 656 3839 - 033 547 2908</p>
            </div>
            <div class="invoice-title">HÓA ĐƠN BÁN HÀNG</div>
            <table class="info">
              <tr>
                <th>Số hóa đơn:</th>
                <td>${getInvoiceNumber(invoice.id)}</td>
                <th>Ngày:</th>
                <td>${invoice.date}</td>
              </tr>
              <tr>
                <th>Khách hàng:</th>
                <td>${invoice.customerName || "-"}</td>
                <th>Mã KH:</th>
                <td>${invoice.customerCode || "-"}</td>
              </tr>
              <tr>
                <th>Phương thức:</th>
                <td colspan="3">${invoice.paymentMethod === "tienMat" ? "Tiền mặt" : "Chuyển khoản"}</td>
              </tr>
            </table>
            <table class="items">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Tên hàng</th>
                  <th>ĐVT</th>
                  <th>Số lượng</th>
                  <th>Đơn giá</th>
                  <th>Thành tiền</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.products
                    .map(
                        (item, idx) => `
                    <tr>
                        <td style="text-align: center; width: 50px;">${idx + 1}</td>
                        <td>${item.product.tenHang}</td>
                        <td style="text-align: center;">Cái</td>
                        <td style="text-align: center;">${item.quantity}</td>
                        <td style="text-align: right;">${getPrice(item.product).toLocaleString("en-US")}</td>
                        <td style="text-align: right;">${(getPrice(item.product) * item.quantity).toLocaleString("en-US")}</td>
                        <td>${item.note ? item.note : ""}</td>
                    </tr>
                `
                    )
                    .join("")}
              </tbody>
              <tfoot>
                <tr>
                    <td style="width: 50px;"></td>
                    <td style="text-align: right;">
                        Tổng số lượng:
                    </td>
                    <td></td>
                    <td style="text-align: center;">${totalQuantity}</td>
                    <td style="text-align: right;"></td>
                    <td style="text-align: right;">${invoice.totalAmount.toLocaleString("en-US")}</td>
                    <td></td>
                </tr>
                <tr>
                    <td style="width: 50px;"></td>
                    <td style="text-align: right;">
                        Chiết khấu:
                    </td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td style="text-align: right;">${invoice.discount}%</td>
                    <td></td>
                </tr>
                <tr>
                    <td style="width: 50px;"></td>
                    <td style="text-align: right;">
                        Khách thanh toán:
                    </td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td style="text-align: right;">${invoice.customerPay.toLocaleString("en-US")}</td>
                    <td></td>
                </tr>
                <tr>
                    <td style="width: 50px;"></td>
                    <td style="text-align: right;">
                        Nợ cũ:
                    </td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td style="text-align: right;">${currentCustomerDebt.toLocaleString("en-US")}</td>
                    <td></td>
                </tr>
                <tr>
                    <td style="width: 50px;"></td>
                    <td style="text-align: right;">
                        Nợ còn lại:
                    </td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td style="text-align: right;">${projectedDebt.toLocaleString("en-US")}</td>
                    <td></td>
                </tr>
              </tfoot>
            </table>
            <div style="width: 100%; margin-top:12px; font-style:italic; text-align: right;">Tổng thanh toán bằng chữ: ${numberToVietnameseWords(invoice.discountedAmount)}</div>
            <div class="footer" style="width: 100%; margin-top:18px; display:flex; justify-content:space-between; font-size:13px;">
                <div>
                        <p></p>
                        <p>Người mua hàng</p>
                </div>
                <div style="text-align:right;">
                        <p>Ngày ${dayjs().format("DD")} tháng ${dayjs().format("MM")} năm ${dayjs().format("YYYY")}</p>
                        <p>Người bán hàng</p>
                </div>
            </div>
          </body>
        </html>
      `
}
