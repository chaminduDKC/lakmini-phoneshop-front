import React, { useRef, useState } from 'react'
import { Printer, ShieldCheck, CheckCircle2, Wrench, Loader2 } from 'lucide-react'
import { Modal } from './Modal'
import { RepairJob } from '@renderer/api/job'
import { BusinessInfo } from '@renderer/api/sale'
import { LOGO_DATA_URL } from '@renderer/assets/logo'

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

    /* Explicit type scale (identical on screen + print) */
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
    .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    @media (min-width: 640px) {
      .sm\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }

    .mx-auto { margin-left: auto; margin-right: auto; }
    .mt-0\\.5 { margin-top: 0.125rem; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-1\\.5 { margin-top: 0.375rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 0.75rem; }
    .mt-4 { margin-top: 1rem; }
    .my-3 { margin-top: 0.75rem; margin-bottom: 0.75rem; }
    .mb-1 { margin-bottom: 0.25rem; }
    .mb-1\\.5 { margin-bottom: 0.375rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-3 { margin-bottom: 0.75rem; }
    .pt-1 { padding-top: 0.25rem; }
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
    .w-72 { width: 18rem; }
    .w-full { width: 100%; }
    .object-contain { object-fit: contain; }
    .block { display: block; }

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

  const shopName = businessInfo?.businessName || 'LAKMINI MOBILE'
  const shopTagline =
    businessInfo?.tagline || 'Mobile Phones, Accessories & Professional Repair Center'
  const shopAddress = businessInfo?.address || 'Main Street, Colombo'
  const shopPhone1 = businessInfo?.phone1 || '077 123 4567'
  const shopPhone2 = businessInfo?.phone2 || '071 987 6543'

  const partsTotal =
    job.partsUsed?.reduce((acc, p) => acc + Number(p.sellingCost || 0) * (p.qtyUsed || 1), 0) || 0

  const serviceCharge = Number(job.serviceCharge || 0)
  const discount = Number(job.discount || 0)
  const advancePaid = Number(job.advancePaid || 0)
  const netTotal = Math.max(0, serviceCharge + partsTotal - discount)
  const balancePaid = Math.max(0, netTotal - advancePaid)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Job Warranty Bill & Invoice"
      size="lg"
      marginTop="0"
    >
      <div className="space-y-4">
        {/* Top actions */}
        <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)] no-print">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <CheckCircle2 size={16} />
            <span>Job Completed & Delivered</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-accent)] hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold rounded-lg text-sm transition-colors shadow-md shadow-amber-500/20"
            >
              {isPrinting ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
              <span>{isPrinting ? 'Generating PDF...' : 'Print Repair Invoice'}</span>
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
          className="printable-job-bill bg-white text-black p-6 rounded-lg border border-[#CCCCCC] shadow-sm font-sans"
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

            {/* Document title + job number, directly under business description */}
            <div className="mt-3">
              <div className="inline-block px-4 py-1.5 bg-[#000000] text-white rounded-md text-[12px] font-bold tracking-wider uppercase">
                PHONE REPAIR INVOICE &amp; WARRANTY
              </div>
              <div className="text-[12.5px] text-[#555555] mt-1.5 font-mono">
                Job No: <span className="font-bold text-[#000000]">{job.jobNumber}</span>
              </div>
            </div>
          </div>

          {/* Job & Customer Grid */}
          <div className="grid grid-cols-2 gap-4 py-3 border-b border-[#CCCCCC] text-[12.5px]">
            <div className="space-y-1">
              <div>
                <span className="text-[#555555] font-medium">Received Date: </span>
                <span className="font-semibold text-[#1A1A1A]">
                  {new Date(job.createdAt).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
              {job.deliveredAt && (
                <div>
                  <span className="text-[#555555] font-medium">Delivered Date: </span>
                  <span className="font-semibold text-[#1A1A1A]">
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
                <span className="text-[#555555] font-medium">Status: </span>
                <span className="font-bold uppercase text-[#000000] bg-[#F5F5F5] px-2 py-0.5 rounded border border-[#CCCCCC]">
                  {job.status}
                </span>
              </div>
            </div>

            <div className="space-y-1 text-right">
              <div>
                <span className="text-[#555555] font-medium">Customer: </span>
                <span className="font-bold text-[#000000]">{job.customerName}</span>
              </div>
              <div>
                <span className="text-[#555555] font-medium">Phone: </span>
                <span className="font-semibold text-[#1A1A1A]">{job.customerPhone}</span>
              </div>
              {job.customer?.address && (
                <div>
                  <span className="text-[#555555] font-medium">Address: </span>
                  <span className="text-[#333333]">{job.customer.address}</span>
                </div>
              )}
              {job.technician && (
                <div>
                  <span className="text-[#555555] font-medium">Technician: </span>
                  <span className="font-semibold text-[#000000]">{job.technician}</span>
                </div>
              )}
            </div>
          </div>

          {/* Device & Fault Details */}
          <div className="my-3 p-3 bg-[#F5F5F5] rounded-lg border border-[#CCCCCC] border-l-4 border-l-[#000000] text-[12.5px] grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <span className="text-[#555555] block font-medium">Device / Model: </span>
              <span className="font-bold text-[#000000] text-[14px]">
                {job.phoneModel.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-[#555555] block font-medium">Condition Received: </span>
              <span className="font-semibold text-[#1A1A1A]">{job.receivedCondition}</span>
            </div>
            <div>
              <span className="text-[#555555] block font-medium">Reported Fault: </span>
              <span className="font-semibold text-[#1A1A1A]">{job.issue}</span>
            </div>
          </div>

          {/* Work Done & Notes if any */}
          {job.repairNotes && (
            <div className="mb-3 p-2.5 bg-[#FAFAFA] rounded border border-[#CCCCCC] text-[12.5px]">
              <span className="font-bold text-[#000000]">Work Done / Action Taken: </span>
              <span className="text-[#333333]">{job.repairNotes}</span>
            </div>
          )}

          {/* Replaced Parts Table */}
          <div className="py-2">
            <div className="font-bold text-[13px] uppercase text-[#000000] mb-1.5 flex items-center gap-1">
              <Wrench size={14} className="text-[#000000]" />
              <span>Parts Replaced &amp; Services</span>
            </div>

            <table className="w-full text-[12.5px] text-left border-collapse">
              <thead>
                <tr className="bg-[#000000] text-white uppercase font-bold text-[12px] tracking-wide">
                  <th className="py-2 px-1 text-center w-8 rounded-l">#</th>
                  <th className="py-2 px-2">Description</th>
                  <th className="py-2 px-2 text-center w-12">Qty</th>
                  <th className="py-2 px-2 text-right w-24">Price (Rs.)</th>
                  <th className="py-2 px-2 text-right w-28 rounded-r">Total (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {job.partsUsed?.map((part, idx) => (
                  <tr key={part.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F5F5]'}>
                    <td className="py-2 px-1 text-center text-[#555555]">{idx + 1}</td>
                    <td className="py-2 px-2">
                      <span className="font-bold text-[#000000] text-[14px]">
                        {part.item?.name || part.partName}
                      </span>
                      {part.source === 'INVENTORY' && part.item && (
                        <span className="text-[11px] text-[#555555] block">
                          SKU: {part.item.sku}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center font-bold text-[#000000] text-[13px]">
                      {part.qtyUsed}
                    </td>
                    <td className="py-2 px-2 text-right font-medium text-[#333333] text-[13px]">
                      {Number(part.sellingCost).toLocaleString(undefined, {
                        minimumFractionDigits: 2
                      })}
                    </td>
                    <td className="py-2 px-2 text-right font-bold text-[#000000] text-[13px]">
                      {(Number(part.sellingCost) * part.qtyUsed).toLocaleString(undefined, {
                        minimumFractionDigits: 2
                      })}
                    </td>
                  </tr>
                ))}
                {serviceCharge > 0 && (
                  <tr className="bg-[#FAFAFA]">
                    <td className="py-2 px-1 text-center text-[#555555]">
                      {(job.partsUsed?.length || 0) + 1}
                    </td>
                    <td className="py-2 px-2 font-bold text-[#000000] text-[14px]">
                      Service Charge / Labor Fee
                    </td>
                    <td className="py-2 px-2 text-center font-semibold text-[#000000] text-[13px]">
                      1
                    </td>
                    <td className="py-2 px-2 text-right font-medium text-[#333333] text-[13px]">
                      {serviceCharge.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-2 text-right font-bold text-[#000000] text-[13px]">
                      {serviceCharge.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pricing Summary */}
          <div className="border-t-2 border-[#000000] pt-3 flex justify-end">
            <div className="w-72 space-y-1.5 text-[13px]">
              <div className="flex justify-between text-[#333333]">
                <span>Parts Total:</span>
                <span className="font-mono font-semibold text-[#1A1A1A]">
                  Rs. {partsTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-[#333333]">
                <span>Service / Labor:</span>
                <span className="font-mono font-semibold text-[#1A1A1A]">
                  Rs. {serviceCharge.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[#333333] font-semibold">
                  <span>Discount:</span>
                  <span className="font-mono">
                    - Rs. {discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-[#000000] pt-1 border-t border-[#999999]">
                <span>Net Total:</span>
                <span className="font-mono font-bold text-[#000000]">
                  Rs. {netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              {advancePaid > 0 && (
                <div className="flex justify-between text-[#333333]">
                  <span>Advance Paid:</span>
                  <span className="font-mono">
                    - Rs. {advancePaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-[17px] font-black text-[#000000] pt-1.5 border-t border-[#000000]">
                <span>Amount Paid at Delivery:</span>
                <span className="font-mono">
                  Rs. {balancePaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Repair Warranty Details & Terms */}
          <div className="mt-4 pt-3 text-[11px] text-[#333333] leading-relaxed bg-[#F5F5F5] p-3 rounded-lg border border-[#CCCCCC] border-l-4 border-l-[#000000]">
            <div className="font-bold uppercase text-[#000000] mb-1 flex items-center justify-between text-[12px]">
              <div className="flex items-center gap-1">
                <ShieldCheck size={14} className="text-[#000000]" />
                <span>
                  Repair Warranty:{' '}
                  <span className="text-[#000000]">{job.warrantyPeriod || 'No Warranty'}</span>
                </span>
              </div>
            </div>
            {job.warrantyDescription && (
              <div className="p-2 bg-white rounded border border-[#CCCCCC] mb-2 font-semibold text-[#000000] text-[12px]">
                {job.warrantyDescription}
              </div>
            )}
            <ol className="list-decimal pl-4 space-y-0.5">
              <li>
                Warranty applies ONLY to the specific parts replaced and labor carried out as listed
                above.
              </li>
              <li>
                Physical impacts, cracked screens, bent chassis, water/liquid exposure, or
                short-circuits VOID warranty.
              </li>
              <li>
                Torn warranty seal stickers or repairs attempted elsewhere automatically cancel this
                warranty.
              </li>
              <li>Original bill must be produced for all warranty claims.</li>
            </ol>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 mt-4 text-center text-[12.5px]">
            <div>
              <div className="border-t border-[#999999] pt-1 font-semibold text-[#333333]">
                Customer Signature
              </div>
            </div>
            <div>
              <div className="border-t border-[#000000] pt-1 font-bold text-[#000000]">
                Technician / Authorized Signature
              </div>
            </div>
          </div>

          <div className="text-center text-[11px] text-[#555555] mt-4 pt-2 border-t border-[#E5E5E5]">
            Thank you for trusting{' '}
            <span className="font-semibold text-[#000000]">Lakmini Mobile</span>! Quality Repairs
            &amp; Service
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