import { useEffect, useRef, useState } from "react";
import { institutionService } from "../services/maintenanceService";

interface ReceiptProps {
  payment: {
    id: number;
    amount: number;
    payment_method: string;
    or_number?: string;
    remarks?: string;
    received_by?: string;
    description?: string;
    payment_type?: string;
    installment_index?: number | null;
    created_at: string;
  };
  student: {
    student_no: string;
    last_name: string;
    first_name: string;
    middle_name?: string;
  };
  course?: { code: string };
  semester?: { name: string };
  schoolYear?: { year_start: number; year_end: number };
  assessment?: {
    total_fee: number;
    total_paid: number;
    balance: number;
    payment_plan?: string;
  };
  installmentLabel?: string;
  onClose: () => void;
}

const formatCurrency = (amount: number) =>
  `₱ ${Number(amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });

const formatTime = (date: string) =>
  new Date(date).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });

export function PaymentReceipt({ payment, student, course, semester, schoolYear, assessment, installmentLabel, onClose }: ReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [institution, setInstitution] = useState<any>(null);

  useEffect(() => {
    institutionService.get().then((r: any) => setInstitution(r.data));
  }, []);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt</title>
        <style>
          @page { size: 80mm auto; margin: 5mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a1a1a; width: 100%; max-width: 300px; margin: 0 auto; }
          .receipt { padding: 8px 4px; }
          .header { text-align: center; padding-bottom: 10px; border-bottom: 2px solid #333; margin-bottom: 10px; }
          .header h1 { font-size: 14px; font-weight: 700; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
          .header p { font-size: 10px; color: #555; }
          .title { text-align: center; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 10px 0; padding: 5px 0; background: #f5f5f5; border-radius: 3px; }
          .row { display: flex; justify-content: space-between; padding: 3px 0; }
          .row .label { color: #666; font-size: 10px; }
          .row .value { font-weight: 600; text-align: right; font-size: 11px; }
          .section { margin: 8px 0; padding: 8px 0; border-top: 1px dashed #ccc; }
          .amount-box { text-align: center; margin: 12px 0; padding: 10px; border: 2px solid #333; border-radius: 4px; }
          .amount-box .label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
          .amount-box .amount { font-size: 20px; font-weight: 700; margin-top: 2px; }
          .balance-section { margin: 8px 0; padding: 8px; background: #f8f8f8; border-radius: 4px; }
          .balance-section .row { padding: 2px 0; }
          .footer { text-align: center; padding-top: 10px; border-top: 1px dashed #ccc; margin-top: 10px; }
          .footer p { font-size: 9px; color: #888; }
          .footer .thanks { font-size: 11px; font-weight: 600; color: #333; margin-bottom: 4px; }
          @media print { body { max-width: none; } }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  };

  const methodLabel = (m: string) => {
    const map: Record<string, string> = { cash: "Cash", check: "Check", bank_transfer: "Bank Transfer", money_order: "Money Order" };
    return map[m] || m;
  };

  const isOther = payment.payment_type === "other";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 pt-[5vh] overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <h3 className="text-sm font-semibold text-gray-900">Payment Receipt</h3>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 transition">
              Print
            </button>
            <button onClick={onClose} className="rounded-lg px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100 transition">
              Close
            </button>
          </div>
        </div>

        <div className="p-5">
          <div ref={printRef}>
            <div className="receipt">
              {/* Header */}
              <div className="header">
                <h1>{institution?.name || "PDM Enrollment System"}</h1>
                <p>Official Payment Receipt</p>
              </div>

              {/* Receipt No & Date */}
              <div className="row">
                <span className="label">Receipt No:</span>
                <span className="value">{payment.or_number || `TXN-${String(payment.id).padStart(6, "0")}`}</span>
              </div>
              <div className="row">
                <span className="label">Date:</span>
                <span className="value">{formatDate(payment.created_at)}</span>
              </div>
              <div className="row">
                <span className="label">Time:</span>
                <span className="value">{formatTime(payment.created_at)}</span>
              </div>

              {/* Student Info */}
              <div className="section">
                <div className="row">
                  <span className="label">Student No:</span>
                  <span className="value">{student.student_no}</span>
                </div>
                <div className="row">
                  <span className="label">Name:</span>
                  <span className="value">{student.last_name}, {student.first_name} {student.middle_name || ""}</span>
                </div>
                {course && (
                  <div className="row">
                    <span className="label">Course:</span>
                    <span className="value">{course.code}</span>
                  </div>
                )}
                {semester && schoolYear && (
                  <div className="row">
                    <span className="label">Term:</span>
                    <span className="value">{semester.name} SY {schoolYear.year_start}-{schoolYear.year_end}</span>
                  </div>
                )}
              </div>

              {/* Payment Type */}
              <div className="title">
                {isOther ? "Other Payment" : installmentLabel ? `Installment Payment` : "Assessment Payment"}
              </div>

              {/* Description for other payments */}
              {isOther && payment.description && (
                <div className="row" style={{ marginBottom: "6px" }}>
                  <span className="label">Description:</span>
                  <span className="value">{payment.description}</span>
                </div>
              )}

              {/* Installment info */}
              {installmentLabel && (
                <div className="row" style={{ marginBottom: "6px" }}>
                  <span className="label">Installment:</span>
                  <span className="value">{installmentLabel}</span>
                </div>
              )}

              {/* Amount */}
              <div className="amount-box">
                <div className="label">Amount Paid</div>
                <div className="amount">{formatCurrency(payment.amount)}</div>
              </div>

              {/* Payment Details */}
              <div className="row">
                <span className="label">Method:</span>
                <span className="value">{methodLabel(payment.payment_method)}</span>
              </div>
              {payment.or_number && (
                <div className="row">
                  <span className="label">OR Number:</span>
                  <span className="value">{payment.or_number}</span>
                </div>
              )}
              {payment.received_by && (
                <div className="row">
                  <span className="label">Received By:</span>
                  <span className="value">{payment.received_by}</span>
                </div>
              )}
              {payment.remarks && (
                <div className="row">
                  <span className="label">Remarks:</span>
                  <span className="value">{payment.remarks}</span>
                </div>
              )}

              {/* Balance Summary (assessment payments only) */}
              {assessment && !isOther && (
                <div className="balance-section">
                  <div className="row">
                    <span className="label">Total Assessment:</span>
                    <span className="value">{formatCurrency(assessment.total_fee)}</span>
                  </div>
                  <div className="row">
                    <span className="label">Total Paid:</span>
                    <span className="value">{formatCurrency(assessment.total_paid)}</span>
                  </div>
                  <div className="row">
                    <span className="label" style={{ fontWeight: 600, color: "#333" }}>Remaining Balance:</span>
                    <span className="value" style={{ color: assessment.balance <= 0 ? "#16a34a" : "#dc2626" }}>
                      {formatCurrency(Math.max(0, assessment.balance))}
                    </span>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="footer">
                <p className="thanks">Thank you for your payment!</p>
                <p>This is a system-generated receipt.</p>
                <p>Printed on {new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
