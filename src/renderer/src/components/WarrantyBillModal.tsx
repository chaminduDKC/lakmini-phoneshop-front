import React, { useRef, useState } from 'react'
import { Printer, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react'
import { Modal } from './Modal'
import { Sale, BusinessInfo } from '@renderer/api/sale'
import { LOGO_DATA_URL } from '@renderer/assets/logo'

interface WarrantyBillModalProps {
  isOpen: boolean
  onClose: () => void
  sale: Sale | null
  businessInfo?: BusinessInfo | null
}

export const WarrantyBillModal: React.FC<WarrantyBillModalProps> = ({
  isOpen,
  onClose,
  sale,
  businessInfo
}) => {
  const printRef = useRef<HTMLDivElement>(null)
  const [isPrinting, setIsPrinting] = useState(false)
  const [printError, setPrintError] = useState<string | null>(null)

  if (!sale) return null

  const handlePrint = async () => {
    if (!printRef.current) return
    setPrintError(null)
    setIsPrinting(true)
    try {
      const innerHtml = printRef.current.outerHTML
      const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice - ${sale.invoiceNumber}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: white; color: #000000; font-size: 12.5px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .bg-white { background-color: #ffffff; }
    .text-black { color: #000000; }
    .p-6 { padding: 1.5rem; }
    .rounded-lg { border-radius: 0.5rem; }
    .rounded-md { border-radius: 0.375rem; }
    .rounded { border-radius: 0.25rem; }
    .rounded-l { border-top-left-radius: 0.25rem; border-bottom-left-radius: 0.25rem; }
    .rounded-r { border-top-right-radius: 0.25rem; border-bottom-right-radius: 0.25rem; }
    .border { border-width: 1px; border-style: solid; }
    .border-b { border-bottom-width: 1px; border-bottom-style: solid; }
    .border-b-2 { border-bottom-width: 2.5px; border-bottom-style: solid; }
    .border-t { border-top-width: 1px; border-top-style: solid; }
    .border-t-2 { border-top-width: 2px; border-top-style: solid; }
    .border-dashed { border-style: dashed; }
    .border-l-4 { border-left-width: 4px; border-left-style: solid; }

    /* Monochrome (black & white) palette */
    .bg-\\[\\#000000\\] { background-color: #000000 !important; color: #ffffff !important; }
    .text-\\[\\#000000\\] { color: #000000 !important; }
    .border-\\[\\#000000\\] { border-color: #000000 !important; }
    .border-l-\\[\\#000000\\] { border-left-color: #000000 !important; }
    .bg-\\[\\#F5F5F5\\] { background-color: #F5F5F5 !important; }
    .bg-\\[\\#FAFAFA\\] { background-color: #FAFAFA !important; }
    .border-\\[\\#999999\\] { border-color: #999999 !important; }
    .border-\\[\\#CCCCCC\\] { border-color: #CCCCCC !important; }
    .border-\\[\\#E5E5E5\\] { border-color: #E5E5E5 !important; }
    .text-\\[\\#555555\\] { color: #555555 !important; }
    .text-\\[\\#333333\\] { color: #333333 !important; }
    .text-\\[\\#1A1A1A\\] { color: #1A1A1A !important; }
    .text-white { color: #ffffff !important; }

    .font-sans { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }

    /* Explicit type scale (kept identical on screen + print) */
    .text-\\[11px\\] { font-size: 11px; line-height: 15px; }
    .text-\\[12px\\] { font-size: 12px; line-height: 16px; }
    .text-\\[12\\.5px\\] { font-size: 12.5px; line-height: 17px; }
    .text-\\[13px\\] { font-size: 13px; line-height: 18px; }
    .text-\\[14px\\] { font-size: 14px; line-height: 19px; }
    .text-\\[17px\\] { font-size: 17px; line-height: 22px; }
    .text-\\[28px\\] { font-size: 28px; line-height: 32px; }

    .font-black { font-weight: 900; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .font-medium { font-weight: 500; }
    .tracking-wider { letter-spacing: 0.05em; }
    .tracking-wide { letter-spacing: 0.025em; }
    .uppercase { text-transform: uppercase; }
    .leading-tight { line-height: 1.25; }
    .leading-relaxed { line-height: 1.6; }

    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .flex-wrap { flex-wrap: wrap; }
    .items-center { align-items: center; }
    .justify-center { justify-content: center; }
    .justify-between { justify-content: space-between; }
    .justify-end { justify-content: flex-end; }
    .shrink-0 { flex-shrink: 0; }
    .gap-3\\.5 { gap: 0.875rem; }
    .gap-x-3 { column-gap: 0.75rem; }
    .gap-2 { gap: 0.5rem; }
    .gap-4 { gap: 1rem; }
    .gap-8 { gap: 2rem; }
    .gap-1 { gap: 0.25rem; }
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }

    .mx-auto { margin-left: auto; margin-right: auto; }
    .mt-0\\.5 { margin-top: 0.125rem; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-1\\.5 { margin-top: 0.375rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 0.75rem; }
    .mt-4 { margin-top: 1rem; }
    .mb-1 { margin-bottom: 0.25rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .pt-1\\.5 { padding-top: 0.375rem; }
    .pt-2 { padding-top: 0.5rem; }
    .pt-3 { padding-top: 0.75rem; }
    .pt-8 { padding-top: 2rem; }
    .pb-3 { padding-bottom: 0.75rem; }
    .pb-4 { padding-bottom: 1rem; }
    .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
    .py-1\\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
    .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
    .py-2\\.5 { padding-top: 0.625rem; padding-bottom: 0.625rem; }
    .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
    .px-1 { padding-left: 0.25rem; padding-right: 0.25rem; }
    .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
    .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
    .px-3\\.5 { padding-left: 0.875rem; padding-right: 0.875rem; }
    .px-4 { padding-left: 1rem; padding-right: 1rem; }
    .p-0\\.5 { padding: 0.125rem; }
    .p-2 { padding: 0.5rem; }
    .p-2\\.5 { padding: 0.625rem; }
    .p-3 { padding: 0.75rem; }

    .w-8 { width: 2rem; }
    .w-12 { width: 3rem; }
    .w-16 { width: 4rem; }
    .h-16 { height: 4rem; }
    .w-20 { width: 5rem; }
    .h-20 { height: 5rem; }
    .w-24 { width: 6rem; }
    .w-28 { width: 7rem; }
    .w-64 { width: 16rem; }
    .w-full { width: 100%; }
    .object-contain { object-fit: contain; }

    .space-y-0\\.5 > * + * { margin-top: 0.125rem; }
    .space-y-1 > * + * { margin-top: 0.25rem; }
    .space-y-1\\.5 > * + * { margin-top: 0.375rem; }
    .divide-y > * + * { border-top-width: 1px; border-top-style: solid; }
    .divide-\\[\\#E5E5E5\\] > * + * { border-top-color: #E5E5E5; }
    .list-decimal { list-style-type: decimal; }
    .pl-4 { padding-left: 1rem; }
    .inline-block { display: inline-block; }

    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 6px 8px; }
    .no-print { display: none !important; }
  </style>
</head>
<body>${innerHtml}</body>
</html>`
      const fileName = `invoice-${sale.invoiceNumber}-${Date.now()}.pdf`
      const result = await window.api.pdf.printHtml(fullHtml, fileName, 'sales-invoices')
      if (!result.success) {
        setPrintError(result.error || 'Failed to generate PDF')
      }
    } catch (err) {
      setPrintError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setIsPrinting(false)
    }
  }

  const shopName = businessInfo?.businessName || 'LAKMINI MOBILE'
  const shopTagline = businessInfo?.tagline || 'Mobile Phones, Accessories & Repair Center'
  const shopAddress = businessInfo?.address || 'Main Street, Colombo'
  const shopPhone1 = businessInfo?.phone1 || '077 123 4567'
  const shopPhone2 = businessInfo?.phone2 || '071 987 6543'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Warranty Bill & Invoice" size="lg" marginTop="0">
      <div className="space-y-4">
        {/* Actions bar at top */}
        <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)] no-print">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <CheckCircle2 size={16} />
            <span>Sale recorded successfully</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-accent)] hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold rounded-lg text-sm transition-colors shadow-md shadow-amber-500/20"
            >
              {isPrinting ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
              <span>{isPrinting ? 'Generating PDF...' : 'Print Warranty Bill'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] rounded-lg text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
        {printError && (
          <div className="text-xs text-red-400 bg-red-950/30 border border-red-800/40 rounded px-3 py-2 no-print">
            ⚠ {printError}
          </div>
        )}

        {/* Printable Bill Area */}
        <div
          ref={printRef}
          className="printable-bill bg-white text-black p-6 rounded-lg border border-[#CCCCCC] shadow-sm font-sans"
        >
          {/* Header — logo + business info, centered */}
          <div className="pb-4 border-b-2 border-[#000000] text-center">
            <img
              src={LOGO_DATA_URL}
              alt="Lakmini Mobile Logo"
              className="w-20 h-20 object-contain mx-auto rounded-lg border border-[#CCCCCC] p-0.5 bg-white shrink-0"
            />
            <h1 className="text-[28px] font-black tracking-wider uppercase text-[#000000] leading-tight mt-2">
              {shopName}
            </h1>
            <p className="text-[13px] text-[#333333] font-semibold tracking-wide mt-0.5">
              {shopTagline}
            </p>
            <div className="text-[12px] text-[#555555] mt-1 flex flex-wrap items-center justify-center gap-x-3 font-medium">
              <span>{shopAddress}</span>
              <span>•</span>
              <span>
                Tel: {shopPhone1} {shopPhone2 ? `/ ${shopPhone2}` : ''}
              </span>
            </div>

            {/* Document title + invoice number, directly under business description */}
            <div className="mt-3">
              <div className="inline-block px-4 py-1.5 bg-[#000000] text-white rounded-md text-[12px] font-bold tracking-wider uppercase">
                WARRANTY BILL &amp; SALES INVOICE
              </div>
              <div className="text-[12.5px] text-[#555555] mt-1.5 font-mono">
                Invoice: <span className="font-bold text-[#000000]">{sale.invoiceNumber}</span>
              </div>
            </div>
          </div>

          {/* Invoice & Customer Meta Grid */}
          <div className="grid grid-cols-2 gap-4 py-3 border-b border-[#CCCCCC] text-[12.5px]">
            <div className="space-y-1">
              <div>
                <span className="text-[#555555] font-medium">Date &amp; Time: </span>
                <span className="font-semibold text-[#1A1A1A]">
                  {new Date(sale.createdAt).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div>
                <span className="text-[#555555] font-medium">Payment Method: </span>
                <span className="font-bold uppercase text-[#000000] bg-[#F5F5F5] px-2 py-0.5 rounded border border-[#CCCCCC]">
                  {sale.paymentMethod}
                </span>
              </div>
            </div>

            <div className="space-y-1 text-right">
              <div>
                <span className="text-[#555555] font-medium">Customer: </span>
                <span className="font-bold text-[#000000]">{sale.customerName}</span>
              </div>
              <div>
                <span className="text-[#555555] font-medium">Phone: </span>
                <span className="font-semibold text-[#1A1A1A]">{sale.customerPhone}</span>
              </div>
              {sale.customer?.address && (
                <div>
                  <span className="text-[#555555] font-medium">Address: </span>
                  <span className="text-[#333333]">{sale.customer.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="py-3">
            <table className="w-full text-[12.5px] text-left border-collapse">
              <thead>
                <tr className="bg-[#000000] text-white uppercase font-bold text-[12px] tracking-wide">
                  <th className="py-2 px-1 text-center w-8 rounded-l">#</th>
                  <th className="py-2 px-2">Item Description</th>
                  <th className="py-2 px-2 text-center">Warranty</th>
                  <th className="py-2 px-2 text-center w-12">Qty</th>
                  <th className="py-2 px-2 text-right w-24">Price (Rs.)</th>
                  <th className="py-2 px-2 text-right w-28 rounded-r">Total (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {sale.items.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F5F5]'}>
                    <td className="py-2.5 px-1 text-center text-[#555555]">{idx + 1}</td>
                    <td className="py-2.5 px-2">
                      <div className="font-bold text-[#000000] text-[14px]">{item.item.name}</div>
                      <div className="text-[11px] text-[#555555]">
                        SKU: {item.item.sku}
                        {item.serialNumber && ` • S/N: ${item.serialNumber}`}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className="inline-block px-2 py-0.5 rounded bg-[#F5F5F5] border border-[#CCCCCC] font-semibold text-[#000000] text-[12px]">
                        {item.warrantyPeriod || 'No Warranty'}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold text-[#000000] text-[13px]">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-2 text-right font-medium text-[#333333] text-[13px]">
                      {Number(item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-2 text-right font-bold text-[#000000] text-[13px]">
                      {Number(item.totalPrice).toLocaleString(undefined, {
                        minimumFractionDigits: 2
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="border-t-2 border-[#000000] pt-3 flex justify-end">
            <div className="w-64 space-y-1.5 text-[13px]">
              <div className="flex justify-between text-[#333333] font-medium">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold text-[#1A1A1A]">
                  Rs.{' '}
                  {Number(sale.subTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              {Number(sale.discount) > 0 && (
                <div className="flex justify-between text-[#333333] font-semibold">
                  <span>Discount:</span>
                  <span className="font-mono">
                    - Rs.{' '}
                    {Number(sale.discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-[17px] font-black text-[#000000] pt-1.5 border-t border-[#999999]">
                <span>Net Total:</span>
                <span className="font-mono">
                  Rs.{' '}
                  {Number(sale.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Notes if any */}
          {sale.notes && (
            <div className="mt-3 p-2.5 bg-[#F5F5F5] rounded border border-[#CCCCCC] text-[12.5px]">
              <span className="font-bold text-[#000000]">Remarks: </span>
              <span className="text-[#333333]">{sale.notes}</span>
            </div>
          )}

          {/* Warranty Terms & Conditions */}
          <div className="mt-4 pt-3 text-[11px] text-[#333333] leading-relaxed bg-[#F5F5F5] p-3 rounded-lg border border-[#CCCCCC] border-l-4 border-l-[#000000]">
            <div className="font-bold uppercase text-[#000000] mb-1 flex items-center gap-1 text-[12px]">
              <ShieldCheck size={14} className="text-[#000000]" />
              <span>Warranty Terms &amp; Conditions</span>
            </div>
            <ol className="list-decimal pl-4 space-y-0.5">
              <li>
                Warranty covers strictly manufacturer / hardware defects during the valid warranty
                period.
              </li>
              <li>
                Physical damages, display cracks, water/liquid damage, power surges, or burnt ICs are
                NOT covered under warranty.
              </li>
              <li>
                Torn warranty seal stickers, unauthorized repair attempts, or software rooting will
                void the warranty.
              </li>
              <li>
                Original bill must be produced for all warranty claims and verification. Goods once
                sold are non-refundable.
              </li>
            </ol>
          </div>

          {/* Signature Lines */}
          <div className="grid grid-cols-2 gap-8 pt-8 mt-4 text-center text-[12.5px]">
            <div>
              <div className="border-t border-[#999999] pt-1 font-semibold text-[#333333]">
                Customer Signature
              </div>
            </div>
            <div>
              <div className="border-t border-[#000000] pt-1 font-bold text-[#000000]">
                Authorized Signature &amp; Seal
              </div>
            </div>
          </div>

          <div className="text-center text-[11px] text-[#555555] mt-4 pt-2 border-t border-[#E5E5E5]">
            Thank you for choosing{' '}
            <span className="font-semibold text-[#000000]">Lakmini Mobile</span> • Quality Mobile
            Solutions &amp; Repairs
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-bill, .printable-bill * {
            visibility: visible;
          }
          .printable-bill {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 15px;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </Modal>
  )
}
