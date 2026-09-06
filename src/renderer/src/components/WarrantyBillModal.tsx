import React, { useRef, useState } from 'react'
import { Printer, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react'
import { Modal } from './Modal'
import { Sale, BusinessInfo } from '@renderer/api/sale'

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
    body { font-family: Arial, sans-serif; background: white; color: black; font-size: 12px; }
    .bg-white { background-color: #ffffff; }
    .text-black { color: #000000; }
    .p-6 { padding: 1.5rem; }
    .rounded-lg { border-radius: 0.5rem; }
    .border { border-width: 1px; border-style: solid; }
    .border-neutral-300 { border-color: #d1d5db; }
    .font-sans { font-family: Arial, sans-serif; }
    .text-center { text-align: center; }
    .text-2xl { font-size: 1.5rem; line-height: 2rem; }
    .font-black { font-weight: 900; }
    .tracking-wider { letter-spacing: 0.05em; }
    .uppercase { text-transform: uppercase; }
    .text-neutral-900 { color: #111827; }
    .text-xs { font-size: 0.75rem; line-height: 1rem; }
    .text-neutral-600 { color: #4b5563; }
    .font-medium { font-weight: 500; }
    .text-neutral-700 { color: #374151; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-0\\.5 { margin-top: 0.125rem; }
    .mt-2\\.5 { margin-top: 0.625rem; }
    .flex { display: flex; }
    .flex-wrap { flex-wrap: wrap; }
    .justify-center { justify-content: center; }
    .gap-x-4 { column-gap: 1rem; }
    .inline-block { display: inline-block; }
    .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
    .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
    .bg-neutral-900 { background-color: #111827; }
    .text-white { color: #ffffff; }
    .rounded { border-radius: 0.25rem; }
    .font-bold { font-weight: 700; }
    .tracking-widest { letter-spacing: 0.1em; }
    .pb-4 { padding-bottom: 1rem; }
    .border-b-2 { border-bottom-width: 2px; border-bottom-style: solid; }
    .border-neutral-800 { border-color: #1f2937; }
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .gap-4 { gap: 1rem; }
    .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
    .border-b { border-bottom-width: 1px; border-bottom-style: solid; }
    .space-y-1 > * + * { margin-top: 0.25rem; }
    .text-neutral-500 { color: #6b7280; }
    .font-mono { font-family: monospace; }
    .font-semibold { font-weight: 600; }
    .text-neutral-800 { color: #1f2937; }
    .text-right { text-align: right; }
    .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
    .py-2\\.5 { padding-top: 0.625rem; padding-bottom: 0.625rem; }
    .px-1 { padding-left: 0.25rem; padding-right: 0.25rem; }
    .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
    .w-8 { width: 2rem; }
    .w-12 { width: 3rem; }
    .w-24 { width: 6rem; }
    .w-28 { width: 7rem; }
    .divide-y > * + * { border-top-width: 1px; border-top-style: solid; }
    .divide-neutral-200 > * + * { border-top-color: #e5e7eb; }
    .text-neutral-400 { color: #9ca3af; }
    .border-t-2 { border-top-width: 2px; border-top-style: solid; }
    .pt-3 { padding-top: 0.75rem; }
    .justify-end { justify-content: flex-end; }
    .w-64 { width: 16rem; }
    .space-y-1\\.5 > * + * { margin-top: 0.375rem; }
    .justify-between { justify-content: space-between; }
    .pt-1 { padding-top: 0.25rem; }
    .border-t { border-top-width: 1px; border-top-style: solid; }
    .text-base { font-size: 1rem; }
    .text-emerald-700 { color: #047857; }
    .mt-3 { margin-top: 0.75rem; }
    .p-2 { padding: 0.5rem; }
    .bg-neutral-50 { background-color: #f9fafb; }
    .border-neutral-200 { border-color: #e5e7eb; }
    .mt-4 { margin-top: 1rem; }
    .border-dashed { border-style: dashed; }
    .border-neutral-400 { border-color: #9ca3af; }
    .leading-relaxed { line-height: 1.625; }
    .mb-1 { margin-bottom: 0.25rem; }
    .list-decimal { list-style-type: decimal; }
    .pl-4 { padding-left: 1rem; }
    .space-y-0\\.5 > * + * { margin-top: 0.125rem; }
    .gap-8 { gap: 2rem; }
    .pt-8 { padding-top: 2rem; }
    .text-\\[10px\\] { font-size: 10px; }
    .text-\\[11px\\] { font-size: 11px; }
    .inline-block { display: inline-block; }
    .border-neutral-300 { border-color: #d1d5db; }
    .bg-neutral-100 { background-color: #f3f4f6; }
    .no-print { display: none !important; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 4px 8px; }
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
          className="printable-bill bg-white text-black p-6 rounded-lg border border-neutral-300 shadow-sm font-sans"
        >
          {/* Header */}
          <div className="text-center pb-4 border-b-2 border-neutral-800">
            <h1 className="text-2xl font-black tracking-wider uppercase text-neutral-900">{shopName}</h1>
            <p className="text-xs text-neutral-600 font-medium mt-0.5">{shopTagline}</p>
            <div className="text-xs text-neutral-700 mt-1 flex flex-wrap justify-center gap-x-4">
              <span>{shopAddress}</span>
              <span>Tel: {shopPhone1} {shopPhone2 ? `/ ${shopPhone2}` : ''}</span>
            </div>
            <div className="mt-2.5 inline-block px-3 py-1 bg-neutral-900 text-white rounded text-xs font-bold tracking-widest uppercase">
              WARRANTY BILL & SALES INVOICE
            </div>
          </div>

          {/* Invoice & Customer Meta Grid */}
          <div className="grid grid-cols-2 gap-4 py-3 border-b border-neutral-300 text-xs">
            <div className="space-y-1">
              <div>
                <span className="text-neutral-500 font-medium">Invoice No: </span>
                <span className="font-bold font-mono text-neutral-900">{sale.invoiceNumber}</span>
              </div>
              <div>
                <span className="text-neutral-500 font-medium">Date & Time: </span>
                <span className="font-semibold text-neutral-800">
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
                <span className="text-neutral-500 font-medium">Payment: </span>
                <span className="font-semibold uppercase text-neutral-800">{sale.paymentMethod}</span>
              </div>
            </div>

            <div className="space-y-1 text-right">
              <div>
                <span className="text-neutral-500 font-medium">Customer: </span>
                <span className="font-bold text-neutral-900">{sale.customerName}</span>
              </div>
              <div>
                <span className="text-neutral-500 font-medium">Phone: </span>
                <span className="font-semibold text-neutral-800">{sale.customerPhone}</span>
              </div>
              {sale.customer?.address && (
                <div>
                  <span className="text-neutral-500 font-medium">Address: </span>
                  <span className="text-neutral-700">{sale.customer.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="py-3">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-neutral-800 text-neutral-900 uppercase font-bold">
                  <th className="py-2 px-1 text-center w-8">#</th>
                  <th className="py-2 px-2">Item Description</th>
                  <th className="py-2 px-2 text-center">Warranty</th>
                  <th className="py-2 px-2 text-center w-12">Qty</th>
                  <th className="py-2 px-2 text-right w-24">Price (Rs.)</th>
                  <th className="py-2 px-2 text-right w-28">Total (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {sale.items.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="py-2.5 px-1 text-center text-neutral-500">{idx + 1}</td>
                    <td className="py-2.5 px-2">
                      <div className="font-bold text-neutral-900">{item.item.name}</div>
                      <div className="text-[11px] text-neutral-500">
                        SKU: {item.item.sku}
                        {item.serialNumber && ` • S/N: ${item.serialNumber}`}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className="inline-block px-2 py-0.5 rounded bg-neutral-100 border border-neutral-300 font-semibold text-neutral-800 text-[11px]">
                        {item.warrantyPeriod || 'No Warranty'}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center font-semibold text-neutral-900">{item.quantity}</td>
                    <td className="py-2.5 px-2 text-right font-medium text-neutral-800">
                      {Number(item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-2 text-right font-bold text-neutral-900">
                      {Number(item.totalPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="border-t-2 border-neutral-800 pt-3 flex justify-end">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-neutral-600 font-medium">
                <span>Subtotal:</span>
                <span>Rs. {Number(sale.subTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              {Number(sale.discount) > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discount:</span>
                  <span>- Rs. {Number(sale.discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-neutral-900 pt-1 border-t border-neutral-400">
                <span>Net Total:</span>
                <span>Rs. {Number(sale.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Notes if any */}
          {sale.notes && (
            <div className="mt-3 p-2 bg-neutral-50 rounded border border-neutral-200 text-xs">
              <span className="font-bold text-neutral-700">Remarks: </span>
              <span className="text-neutral-600">{sale.notes}</span>
            </div>
          )}

          {/* Warranty Terms & Conditions */}
          <div className="mt-4 pt-3 border-t border-dashed border-neutral-400 text-[10px] text-neutral-600 leading-relaxed">
            <div className="font-bold uppercase text-neutral-800 mb-1 flex items-center gap-1">
              <ShieldCheck size={12} />
              <span>Warranty Terms & Conditions:</span>
            </div>
            <ol className="list-decimal pl-4 space-y-0.5">
              <li>Warranty covers strictly manufacturer / hardware defects during the valid warranty period.</li>
              <li>Physical damages, display cracks, water/liquid damage, power surges, or burnt ICs are NOT covered under warranty.</li>
              <li>Torn warranty seal stickers, unauthorized repair attempts, or software rooting will void the warranty.</li>
              <li>Original bill must be produced for all warranty claims and verification. Goods once sold are non-refundable.</li>
            </ol>
          </div>

          {/* Signature Lines */}
          <div className="grid grid-cols-2 gap-8 pt-8 mt-4 text-center text-xs">
            <div>
              <div className="border-t border-neutral-400 pt-1 font-semibold text-neutral-700">
                Customer Signature
              </div>
            </div>
            <div>
              <div className="border-t border-neutral-400 pt-1 font-semibold text-neutral-700">
                Authorized Signature & Seal
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] text-neutral-400 mt-4 pt-2 border-t border-neutral-200">
            Thank you for your business! Lakmini Mobile Management System
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
