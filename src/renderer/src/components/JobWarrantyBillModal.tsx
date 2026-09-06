import React, { useRef, useState } from 'react'
import { Printer, ShieldCheck, CheckCircle2, Wrench, Loader2 } from 'lucide-react'
import { Modal } from './Modal'
import { RepairJob } from '@renderer/api/job'
import { BusinessInfo } from '@renderer/api/sale'

interface JobWarrantyBillModalProps {
  isOpen: boolean
  onClose: () => void
  job: RepairJob | null
  businessInfo?: BusinessInfo | null
}

export const JobWarrantyBillModal: React.FC<JobWarrantyBillModalProps> = ({
  isOpen,
  onClose,
  job,
  businessInfo
}) => {
  const printRef = useRef<HTMLDivElement>(null)
  const [isPrinting, setIsPrinting] = useState(false)
  const [printError, setPrintError] = useState<string | null>(null)

  if (!job) return null

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
  <title>Repair Invoice - ${job.jobNumber}</title>
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
    .mt-0\\.5 { margin-top: 0.125rem; }
    .text-neutral-700 { color: #374151; }
    .mt-1 { margin-top: 0.25rem; }
    .flex { display: flex; }
    .flex-wrap { flex-wrap: wrap; }
    .justify-center { justify-content: center; }
    .gap-x-4 { column-gap: 1rem; }
    .mt-2\\.5 { margin-top: 0.625rem; }
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
    .my-3 { margin-top: 0.75rem; margin-bottom: 0.75rem; }
    .p-3 { padding: 0.75rem; }
    .bg-neutral-50 { background-color: #f9fafb; }
    .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
    .gap-2 { gap: 0.5rem; }
    .mb-3 { margin-bottom: 0.75rem; }
    .p-2\\.5 { padding: 0.625rem; }
    .bg-neutral-50 { background-color: #f9fafb; }
    .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
    .mb-1\\.5 { margin-bottom: 0.375rem; }
    .items-center { align-items: center; }
    .gap-1 { gap: 0.25rem; }
    .w-full { width: 100%; }
    .text-left { text-align: left; }
    .border-collapse { border-collapse: collapse; }
    .py-1\\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
    .px-1 { padding-left: 0.25rem; padding-right: 0.25rem; }
    .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
    .w-8 { width: 2rem; }
    .w-12 { width: 3rem; }
    .w-24 { width: 6rem; }
    .w-28 { width: 7rem; }
    .divide-y > * + * { border-top-width: 1px; border-top-style: solid; }
    .divide-neutral-200 > * + * { border-top-color: #e5e7eb; }
    .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
    .text-neutral-400 { color: #9ca3af; }
    .border-t-2 { border-top-width: 2px; border-top-style: solid; }
    .pt-3 { padding-top: 0.75rem; }
    .justify-end { justify-content: flex-end; }
    .w-72 { width: 18rem; }
    .space-y-1\\.5 > * + * { margin-top: 0.375rem; }
    .justify-between { justify-content: space-between; }
    .pt-1 { padding-top: 0.25rem; }
    .border-t { border-top-width: 1px; border-top-style: solid; }
    .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
    .text-emerald-700 { color: #047857; }
    .mt-4 { margin-top: 1rem; }
    .pt-3 { padding-top: 0.75rem; }
    .border-dashed { border-style: dashed; }
    .border-neutral-400 { border-color: #9ca3af; }
    .text-\\[10px\\] { font-size: 10px; }
    .leading-relaxed { line-height: 1.625; }
    .mb-1 { margin-bottom: 0.25rem; }
    .justify-between { justify-content: space-between; }
    .text-emerald-700 { color: #047857; }
    .list-decimal { list-style-type: decimal; }
    .pl-4 { padding-left: 1rem; }
    .space-y-0\\.5 > * + * { margin-top: 0.125rem; }
    .gap-8 { gap: 2rem; }
    .pt-8 { padding-top: 2rem; }
    .text-neutral-200 { border-color: #e5e7eb; }
    .p-2 { padding: 0.5rem; }
    .text-\\[11px\\] { font-size: 11px; }
    .no-print { display: none !important; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 4px 8px; }
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body>${innerHtml}</body>
</html>`
      const fileName = `repair-invoice-${job.jobNumber}-${Date.now()}.pdf`
      const result = await window.api.pdf.printHtml(fullHtml, fileName, 'repair-invoices')
      if (!result.success) {
        setPrintError(result.error || 'Failed to generate PDF')
      }
    } catch (err) {
      setPrintError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setIsPrinting(false)
    }
  }

  const shopName = businessInfo?.businessName || 'LAKMINI MOBILEcc'
  const shopTagline = businessInfo?.tagline || 'Mobile Phones, Accessories & Professional Repair Center'
  const shopAddress = businessInfo?.address || 'Main Street, Colombo'
  const shopPhone1 = businessInfo?.phone1 || '077 123 4567'
  const shopPhone2 = businessInfo?.phone2 || '071 987 6543'

  const partsTotal = job.partsUsed?.reduce(
    (sum, p) => sum + Number(p.sellingCost || 0) * (p.qtyUsed || 1),
    0
  ) || 0

  const serviceCharge = Number(job.serviceCharge || 0)
  const discount = Number(job.discount || 0)
  const advancePaid = Number(job.advancePaid || 0)
  const grossTotal = partsTotal + serviceCharge
  const netTotal = Math.max(0, grossTotal - discount)
  const balancePaid = Math.max(0, netTotal - advancePaid)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Repair Job Invoice & Warranty Bill" size="lg" marginTop="0">
      <div className="space-y-4">
        {/* Top action bar */}
        <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)] no-print">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <CheckCircle2 size={16} />
            <span>Repair invoice ready</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-accent)] hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold rounded-lg text-sm transition-colors shadow-md shadow-amber-500/20"
            >
              {isPrinting ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
              <span>{isPrinting ? 'Generating PDF...' : 'Print Repair Bill'}</span>
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


        {/* Printable Area */}
        <div
          ref={printRef}
          className="printable-job-bill bg-white text-black p-6 rounded-lg border border-neutral-300 shadow-sm font-sans"
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
              PHONE REPAIR INVOICE & WARRANTY BILL
            </div>
          </div>

          {/* Job & Customer Grid */}
          <div className="grid grid-cols-2 gap-4 py-3 border-b border-neutral-300 text-xs">
            <div className="space-y-1">
              <div>
                <span className="text-neutral-500 font-medium">Job No: </span>
                <span className="font-bold font-mono text-neutral-900">{job.jobNumber}</span>
              </div>
              <div>
                <span className="text-neutral-500 font-medium">Received Date: </span>
                <span className="font-semibold text-neutral-800">
                  {new Date(job.createdAt).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
              {job.deliveredAt && (
                <div>
                  <span className="text-neutral-500 font-medium">Delivered Date: </span>
                  <span className="font-semibold text-neutral-800">
                    {new Date(job.deliveredAt).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
              <div>
                <span className="text-neutral-500 font-medium">Status: </span>
                <span className="font-bold uppercase text-neutral-900">{job.status}</span>
              </div>
            </div>

            <div className="space-y-1 text-right">
              <div>
                <span className="text-neutral-500 font-medium">Customer: </span>
                <span className="font-bold text-neutral-900">{job.customerName}</span>
              </div>
              <div>
                <span className="text-neutral-500 font-medium">Phone: </span>
                <span className="font-semibold text-neutral-800">{job.customerPhone}</span>
              </div>
              {job.customer?.address && (
                <div>
                  <span className="text-neutral-500 font-medium">Address: </span>
                  <span className="text-neutral-700">{job.customer.address}</span>
                </div>
              )}
              {job.technician && (
                <div>
                  <span className="text-neutral-500 font-medium">Technician: </span>
                  <span className="font-semibold text-neutral-800">{job.technician}</span>
                </div>
              )}
            </div>
          </div>

          {/* Device & Fault Details */}
          <div className="my-3 p-3 bg-neutral-50 rounded border border-neutral-300 text-xs grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <span className="text-neutral-500 block font-medium">Device / Model: </span>
              <span className="font-bold text-neutral-900">{job.phoneModel.toUpperCase()}</span>
            </div>
            <div>
              <span className="text-neutral-500 block font-medium">Condition Received: </span>
              <span className="font-semibold text-neutral-800">{job.receivedCondition}</span>
            </div>
            <div>
              <span className="text-neutral-500 block font-medium">Reported Fault: </span>
              <span className="font-semibold text-neutral-800">{job.issue}</span>
            </div>
          </div>

          {/* Work Done & Notes if any */}
          {job.repairNotes && (
            <div className="mb-3 p-2.5 bg-neutral-50 rounded border border-neutral-200 text-xs">
              <span className="font-bold text-neutral-700">Work Done / Action Taken: </span>
              <span className="text-neutral-800">{job.repairNotes}</span>
            </div>
          )}

          {/* Replaced Parts Table */}
          <div className="py-2">
            <div className="font-bold text-xs uppercase text-neutral-800 mb-1.5 flex items-center gap-1">
              <Wrench size={13} />
              <span>Parts Replaced & Services</span>
            </div>

            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-neutral-800 text-neutral-900 uppercase font-bold">
                  <th className="py-1.5 px-1 text-center w-8">#</th>
                  <th className="py-1.5 px-2">Description</th>
                  <th className="py-1.5 px-2 text-center w-12">Qty</th>
                  <th className="py-1.5 px-2 text-right w-24">Price (Rs.)</th>
                  <th className="py-1.5 px-2 text-right w-28">Total (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {job.partsUsed?.map((part, idx) => (
                  <tr key={part.id}>
                    <td className="py-2 px-1 text-center text-neutral-500">{idx + 1}</td>
                    <td className="py-2 px-2">
                      <span className="font-bold text-neutral-900">
                        {part.item?.name || part.partName}
                      </span>
                      {part.source === 'INVENTORY' && part.item && (
                        <span className="text-[10px] text-neutral-500 block">SKU: {part.item.sku}</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center font-semibold text-neutral-900">{part.qtyUsed}</td>
                    <td className="py-2 px-2 text-right font-medium text-neutral-800">
                      {Number(part.sellingCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-2 text-right font-bold text-neutral-900">
                      {(Number(part.sellingCost) * part.qtyUsed).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {serviceCharge > 0 && (
                  <tr>
                    <td className="py-2 px-1 text-center text-neutral-500">{(job.partsUsed?.length || 0) + 1}</td>
                    <td className="py-2 px-2 font-bold text-neutral-900">Service Charge / Labor Fee</td>
                    <td className="py-2 px-2 text-center font-semibold text-neutral-900">1</td>
                    <td className="py-2 px-2 text-right font-medium text-neutral-800">
                      {serviceCharge.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-2 text-right font-bold text-neutral-900">
                      {serviceCharge.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pricing Summary */}
          <div className="border-t-2 border-neutral-800 pt-3 flex justify-end">
            <div className="w-72 space-y-1.5 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Parts Total:</span>
                <span>Rs. {partsTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Service / Labor:</span>
                <span>Rs. {serviceCharge.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span>- Rs. {discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-neutral-900 pt-1 border-t border-neutral-300">
                <span>Net Total:</span>
                <span>Rs. {netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              {advancePaid > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span>Advance Paid:</span>
                  <span>- Rs. {advancePaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-neutral-900 pt-1 border-t border-neutral-400">
                <span>Amount Paid at Delivery:</span>
                <span>Rs. {balancePaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Repair Warranty Details & Terms */}
          <div className="mt-4 pt-3 border-t border-dashed border-neutral-400 text-[10px] text-neutral-600 leading-relaxed">
            <div className="font-bold uppercase text-neutral-800 mb-1 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-700" />
                <span>Repair Warranty: {job.warrantyPeriod || 'No Warranty'}</span>
              </div>
            </div>
            {job.warrantyDescription && (
              <div className="p-2 bg-neutral-100 rounded border border-neutral-300 mb-2 font-medium text-neutral-800 text-[11px]">
                {job.warrantyDescription}
              </div>
            )}
            <ol className="list-decimal pl-4 space-y-0.5">
              <li>Warranty applies ONLY to the specific parts replaced and labor carried out as listed above.</li>
              <li>Physical impacts, cracked screens, bent chassis, water/liquid exposure, or short-circuits VOID warranty.</li>
              <li>Torn warranty seal stickers or repairs attempted elsewhere automatically cancel this warranty.</li>
              <li>Original bill must be produced for all warranty claims.</li>
            </ol>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 mt-4 text-center text-xs">
            <div>
              <div className="border-t border-neutral-400 pt-1 font-semibold text-neutral-700">
                Customer Signature
              </div>
            </div>
            <div>
              <div className="border-t border-neutral-400 pt-1 font-semibold text-neutral-700">
                Technician / Authorized Signature
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] text-neutral-400 mt-4 pt-2 border-t border-neutral-200">
            Thank you for trusting Lakmini Mobile!
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-job-bill, .printable-job-bill * {
            visibility: visible;
          }
          .printable-job-bill {
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
