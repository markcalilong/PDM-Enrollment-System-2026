import { useState, useEffect, useMemo } from "react";
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineFunnel,
  HiOutlineCreditCard,
  HiOutlineBanknotes,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlinePrinter,
} from "react-icons/hi2";
import { paymentService } from "../../services/maintenanceService";
import { Button } from "../../components/ui/Button";
import { SearchSelect } from "../../components/ui/SearchSelect";
import { Modal } from "../../components/ui/Modal";
import { PaymentReceipt } from "../../components/PaymentReceipt";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "money_order", label: "Money Order" },
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    assessed: "bg-amber-50 text-amber-700",
    partial: "bg-blue-50 text-blue-700",
    paid: "bg-green-50 text-green-700",
  };
  const labels: Record<string, string> = {
    assessed: "Unpaid",
    partial: "Partial",
    paid: "Fully Paid",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[status] || "bg-gray-50 text-gray-700"}`}>
      {labels[status] || status}
    </span>
  );
}

const formatCurrency = (amount: number) =>
  `₱ ${Number(amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

const formatDate = (date: string) => {
  const d = new Date(date);
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

type Tab = "assessment" | "other";

export function PaymentPage() {
  const [activeTab, setActiveTab] = useState<Tab>("assessment");

  // ─── ASSESSMENT PAYMENT STATE ─────────────────────────
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSearch, setFilterSearch] = useState("");
  const [selectedAssessment, setSelectedAssessment] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ─── OTHER PAYMENT STATE ──────────────────────────────
  const [otherPayments, setOtherPayments] = useState<any[]>([]);
  const [otherLoading, setOtherLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [showOtherForm, setShowOtherForm] = useState(false);
  const [otherStudentId, setOtherStudentId] = useState<number>(0);
  const [otherAmount, setOtherAmount] = useState("");
  const [otherDescription, setOtherDescription] = useState("");
  const [otherMethod, setOtherMethod] = useState("cash");
  const [otherOrNumber, setOtherOrNumber] = useState("");
  const [otherRemarks, setOtherRemarks] = useState("");
  const [otherReceivedBy, setOtherReceivedBy] = useState("");
  const [otherSaving, setOtherSaving] = useState(false);
  const [otherError, setOtherError] = useState<string | null>(null);
  const [otherFilterSearch, setOtherFilterSearch] = useState("");

  // ─── ASSESSMENT PAYMENT FORM STATE ────────────────────
  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmount, setPayAmount] = useState<string>("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payOrNumber, setPayOrNumber] = useState("");
  const [payRemarks, setPayRemarks] = useState("");
  const [payReceivedBy, setPayReceivedBy] = useState("");
  const [payInstallmentIndex, setPayInstallmentIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── RECEIPT STATE ────────────────────────────────────
  const [receiptPayment, setReceiptPayment] = useState<any | null>(null);
  const [receiptContext, setReceiptContext] = useState<any>(null);

  useEffect(() => {
    fetchAssessments();
  }, []);

  useEffect(() => {
    if (activeTab === "other") {
      fetchOtherPayments();
      paymentService.getStudents().then((r) => setStudents(r.data || []));
    }
  }, [activeTab]);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const res = await paymentService.getAssessments();
      setAssessments(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchOtherPayments = async () => {
    setOtherLoading(true);
    try {
      const res = await paymentService.getOtherPayments();
      setOtherPayments(res.data || []);
    } finally {
      setOtherLoading(false);
    }
  };

  const filteredAssessments = useMemo(() => {
    if (!filterSearch.trim()) return assessments;
    const q = filterSearch.toLowerCase();
    return assessments.filter(
      (a: any) =>
        a.student?.last_name?.toLowerCase().includes(q) ||
        a.student?.first_name?.toLowerCase().includes(q) ||
        a.student?.student_no?.toLowerCase().includes(q)
    );
  }, [assessments, filterSearch]);

  const filteredOtherPayments = useMemo(() => {
    if (!otherFilterSearch.trim()) return otherPayments;
    const q = otherFilterSearch.toLowerCase();
    return otherPayments.filter(
      (p: any) =>
        p.student?.last_name?.toLowerCase().includes(q) ||
        p.student?.first_name?.toLowerCase().includes(q) ||
        p.student?.student_no?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
  }, [otherPayments, otherFilterSearch]);

  const viewDetail = async (assessment: any) => {
    setDetailLoading(true);
    try {
      const res = await paymentService.getByAssessment(assessment.id);
      setSelectedAssessment(res.data);
    } catch {
      setSelectedAssessment(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // ─── Installment helpers ──────────────────────────────
  const installments: any[] = selectedAssessment?.installments || [];
  const hasInstallments = installments.length > 0 && selectedAssessment?.payment_plan !== "full";

  const installmentStatuses = useMemo(() => {
    if (!hasInstallments || !selectedAssessment) return [];
    const payments = selectedAssessment.payments || [];
    let runningPaid = 0;
    return installments.map((inst: any, idx: number) => {
      const instAmount = Number(inst.amount);
      const directPayments = payments.filter((p: any) => p.installment_index === idx);
      const directPaid = directPayments.reduce((s: number, p: any) => s + Number(p.amount), 0);

      if (directPaid > 0) {
        runningPaid += directPaid;
        return {
          ...inst,
          index: idx,
          paid: directPaid,
          remaining: Math.max(0, instAmount - directPaid),
          status: directPaid >= instAmount ? "paid" : "partial",
        };
      }

      const remaining = Math.max(0, instAmount - Math.max(0, runningPaid - installments.slice(0, idx).reduce((s: number, i: any) => s + Number(i.amount), 0)));
      const paid = instAmount - remaining;
      return {
        ...inst,
        index: idx,
        paid: Math.max(0, paid),
        remaining,
        status: remaining <= 0 ? "paid" : paid > 0 ? "partial" : "unpaid",
      };
    });
  }, [hasInstallments, selectedAssessment, installments]);

  const openPayForm = (installmentIdx?: number) => {
    if (!selectedAssessment) return;
    setPayAmount("");
    setPayMethod("cash");
    setPayOrNumber("");
    setPayRemarks("");
    setPayReceivedBy("");
    setPayInstallmentIndex(installmentIdx != null ? installmentIdx : null);
    setError(null);

    if (installmentIdx != null && installmentStatuses[installmentIdx]) {
      const remaining = installmentStatuses[installmentIdx].remaining;
      if (remaining > 0) {
        setPayAmount(remaining.toFixed(2));
      }
    }

    setShowPayForm(true);
  };

  const handlePayFull = () => {
    if (!selectedAssessment) return;
    if (payInstallmentIndex != null && installmentStatuses[payInstallmentIndex]) {
      setPayAmount(installmentStatuses[payInstallmentIndex].remaining.toFixed(2));
    } else {
      setPayAmount(Number(selectedAssessment.balance).toFixed(2));
    }
  };

  const handleSubmitPayment = async () => {
    if (!selectedAssessment) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (amount > selectedAssessment.balance + 0.01) {
      setError(`Amount exceeds remaining balance of ${formatCurrency(selectedAssessment.balance)}.`);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await paymentService.create({
        assessment_id: selectedAssessment.id,
        payment_type: "assessment",
        installment_index: payInstallmentIndex,
        amount,
        payment_method: payMethod,
        or_number: payOrNumber.trim() || null,
        remarks: payRemarks.trim() || null,
        received_by: payReceivedBy.trim() || null,
      });
      setShowPayForm(false);
      fetchAssessments();
      viewDetail(selectedAssessment);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process payment");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (!confirm("Delete this payment record?")) return;
    try {
      await paymentService.remove(paymentId);
      fetchAssessments();
      if (selectedAssessment) viewDetail(selectedAssessment);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  // ─── Other payment handlers ───────────────────────────
  const studentOptions = useMemo(() =>
    students.map((s: any) => ({
      value: s.id,
      label: `${s.last_name}, ${s.first_name}`,
      sublabel: s.student_no,
    })),
    [students]
  );

  const openOtherForm = () => {
    setOtherStudentId(0);
    setOtherAmount("");
    setOtherDescription("");
    setOtherMethod("cash");
    setOtherOrNumber("");
    setOtherRemarks("");
    setOtherReceivedBy("");
    setOtherError(null);
    setShowOtherForm(true);
  };

  const handleSubmitOther = async () => {
    const amount = Number(otherAmount);
    if (!otherStudentId) { setOtherError("Please select a student."); return; }
    if (!amount || amount <= 0) { setOtherError("Please enter a valid amount."); return; }
    if (!otherDescription.trim()) { setOtherError("Please enter a description."); return; }

    setOtherSaving(true);
    setOtherError(null);
    try {
      await paymentService.create({
        student_id: otherStudentId,
        payment_type: "other",
        amount,
        description: otherDescription.trim(),
        payment_method: otherMethod,
        or_number: otherOrNumber.trim() || null,
        remarks: otherRemarks.trim() || null,
        received_by: otherReceivedBy.trim() || null,
      });
      setShowOtherForm(false);
      fetchOtherPayments();
    } catch (err) {
      setOtherError(err instanceof Error ? err.message : "Failed to process payment");
    } finally {
      setOtherSaving(false);
    }
  };

  const handleDeleteOther = async (id: number) => {
    if (!confirm("Delete this payment record?")) return;
    try {
      await paymentService.remove(id);
      fetchOtherPayments();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  // ─── Receipt handlers ─────────────────────────────────
  const openAssessmentReceipt = (payment: any) => {
    if (!selectedAssessment) return;
    const instLabel = payment.installment_index != null && installments[payment.installment_index]
      ? `#${payment.installment_index + 1} — ${installments[payment.installment_index]?.label}`
      : undefined;
    setReceiptPayment(payment);
    setReceiptContext({
      student: selectedAssessment.student,
      course: selectedAssessment.course,
      semester: selectedAssessment.semester,
      schoolYear: selectedAssessment.school_year,
      assessment: {
        total_fee: Number(selectedAssessment.total_fee),
        total_paid: selectedAssessment.total_paid,
        balance: selectedAssessment.balance,
        payment_plan: selectedAssessment.payment_plan,
      },
      installmentLabel: instLabel,
    });
  };

  const openOtherReceipt = (payment: any) => {
    setReceiptPayment(payment);
    setReceiptContext({
      student: payment.student,
      course: payment.course,
    });
  };

  // ─── RENDER ───────────────────────────────────────────
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Payment</h1>
        <p className="mt-0.5 text-sm text-gray-600">Process student payments</p>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-lg bg-gray-100 p-1 w-fit">
        <button
          onClick={() => setActiveTab("assessment")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition ${
            activeTab === "assessment"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Assessment Payment
        </button>
        <button
          onClick={() => setActiveTab("other")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition ${
            activeTab === "other"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Other Payment
        </button>
      </div>

      {activeTab === "assessment" ? (
        /* ═══════════════════════════════════════════════════
           ASSESSMENT PAYMENT TAB
           ═══════════════════════════════════════════════════ */
        <div className="grid grid-cols-12 gap-6">
          {/* Left: assessment list */}
          <div className="col-span-5">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 px-3 py-2.5">
                <div className="relative">
                  <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    placeholder="Search student name or no..."
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-8 py-2 text-sm placeholder:text-gray-500 focus:border-primary-500 focus:bg-white focus:ring-1 focus:ring-primary-500 outline-none transition"
                  />
                  {filterSearch && (
                    <button onClick={() => setFilterSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                      <HiOutlineXMark className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
                <HiOutlineFunnel className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                <span className="text-[11px] text-gray-500">{filteredAssessments.length} record{filteredAssessments.length !== 1 ? "s" : ""}</span>
              </div>

              {loading ? (
                <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-[3px] border-gray-200 border-t-primary-600" /></div>
              ) : filteredAssessments.length === 0 ? (
                <div className="py-12 text-center"><p className="text-sm text-gray-500">{filterSearch ? "No matching records" : "No assessed students yet"}</p></div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[calc(100vh-370px)] overflow-y-auto scrollbar-thin">
                  {filteredAssessments.map((assessment: any) => {
                    const isSelected = selectedAssessment?.id === assessment.id;
                    const paidPercent = Number(assessment.total_fee) > 0
                      ? Math.min(100, Math.round((assessment.total_paid / Number(assessment.total_fee)) * 100))
                      : 0;
                    return (
                      <div
                        key={assessment.id}
                        className={`px-4 py-3.5 cursor-pointer transition ${isSelected ? "bg-primary-50 border-l-[3px] border-l-primary-600" : "hover:bg-gray-50 border-l-[3px] border-l-transparent"}`}
                        onClick={() => viewDetail(assessment)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-semibold truncate ${isSelected ? "text-primary-700" : "text-gray-800"}`}>
                              {assessment.student?.last_name}, {assessment.student?.first_name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{assessment.student?.student_no} — {assessment.course?.code}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[11px] text-gray-500">{assessment.semester?.name}</span>
                              <span className="text-[11px] text-gray-500">SY {assessment.school_year?.year_start}-{assessment.school_year?.year_end}</span>
                              {assessment.payment_plan && assessment.payment_plan !== "full" && (
                                <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">
                                  {assessment.payment_plan === "flexible" ? "Flexible" : `${assessment.payment_plan}-Pay`}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-gray-500">Balance</p>
                            <p className={`text-sm font-bold ${assessment.balance <= 0 ? "text-green-600" : "text-red-600"}`}>
                              {formatCurrency(assessment.balance)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-[10px] text-gray-500 mb-0.5">
                            <span>{paidPercent}% paid</span>
                            <span>{formatCurrency(assessment.total_fee)}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${paidPercent >= 100 ? "bg-green-500" : paidPercent > 0 ? "bg-blue-500" : "bg-gray-300"}`} style={{ width: `${paidPercent}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: detail */}
          <div className="col-span-7">
            {!selectedAssessment ? (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-24">
                <HiOutlineCreditCard className="h-10 w-10 text-gray-400" />
                <p className="mt-3 text-sm text-gray-500">Select an assessment to view payment details</p>
              </div>
            ) : detailLoading ? (
              <div className="flex justify-center rounded-xl border border-gray-200 bg-white py-24">
                <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-primary-600" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Student Header */}
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {selectedAssessment.student?.last_name}, {selectedAssessment.student?.first_name} {selectedAssessment.student?.middle_name || ""}
                      </h2>
                      <p className="text-sm text-gray-500">{selectedAssessment.student?.student_no} — {selectedAssessment.course?.code}</p>
                    </div>
                    <StatusBadge status={selectedAssessment.status} />
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1.5"><span className="text-gray-500">Semester:</span><span className="font-medium">{selectedAssessment.semester?.name}</span></div>
                    <div className="flex items-center gap-1.5"><span className="text-gray-500">SY:</span><span className="font-medium">{selectedAssessment.school_year?.year_start}-{selectedAssessment.school_year?.year_end}</span></div>
                    {selectedAssessment.payment_plan && selectedAssessment.payment_plan !== "full" && (
                      <div className="flex items-center gap-1.5"><span className="text-gray-500">Plan:</span><span className="font-medium capitalize">{selectedAssessment.payment_plan === "flexible" ? "Flexible" : `${selectedAssessment.payment_plan}-Payment`}</span></div>
                    )}
                  </div>
                </div>

                {/* Balance Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Assessment</p>
                    <p className="mt-1 text-lg font-bold text-gray-900">{formatCurrency(selectedAssessment.total_fee)}</p>
                  </div>
                  <div className="rounded-xl border border-blue-200 bg-blue-50 shadow-sm p-4">
                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Total Paid</p>
                    <p className="mt-1 text-lg font-bold text-blue-800">{formatCurrency(selectedAssessment.total_paid)}</p>
                  </div>
                  <div className={`rounded-xl border shadow-sm p-4 ${selectedAssessment.balance <= 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                    <p className={`text-xs font-medium uppercase tracking-wider ${selectedAssessment.balance <= 0 ? "text-green-600" : "text-red-600"}`}>
                      {selectedAssessment.balance <= 0 ? "Fully Paid" : "Remaining Balance"}
                    </p>
                    <p className={`mt-1 text-lg font-bold ${selectedAssessment.balance <= 0 ? "text-green-800" : "text-red-800"}`}>
                      {formatCurrency(Math.max(0, selectedAssessment.balance))}
                    </p>
                  </div>
                </div>

                {/* Installment Schedule */}
                {hasInstallments && (
                  <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <div className="bg-gray-50/80 px-5 py-3 border-b border-gray-100">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-600">
                        Installment Schedule ({installments.length} payments)
                      </p>
                    </div>
                    <table className="min-w-full">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-wider text-gray-600 border-b border-gray-100">
                          <th className="px-4 py-2 text-left font-semibold">#</th>
                          <th className="px-4 py-2 text-left font-semibold">Description</th>
                          <th className="px-4 py-2 text-right font-semibold w-28">Due Amount</th>
                          <th className="px-4 py-2 text-right font-semibold w-24">Paid</th>
                          <th className="px-4 py-2 text-right font-semibold w-24">Remaining</th>
                          <th className="px-4 py-2 text-center font-semibold w-20">Status</th>
                          <th className="px-4 py-2 w-20" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {installmentStatuses.map((inst: any) => (
                          <tr key={inst.index} className="text-sm hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-2.5 text-gray-500 font-medium">{inst.index + 1}</td>
                            <td className="px-4 py-2.5 text-gray-800 font-medium">{inst.label}</td>
                            <td className="px-4 py-2.5 text-right text-gray-700">{formatCurrency(inst.amount)}</td>
                            <td className="px-4 py-2.5 text-right text-green-700 font-medium">{formatCurrency(inst.paid)}</td>
                            <td className="px-4 py-2.5 text-right text-gray-600">{formatCurrency(inst.remaining)}</td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                inst.status === "paid" ? "bg-green-50 text-green-700" :
                                inst.status === "partial" ? "bg-blue-50 text-blue-700" :
                                "bg-gray-100 text-gray-600"
                              }`}>
                                {inst.status === "paid" ? "Paid" : inst.status === "partial" ? "Partial" : "Unpaid"}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              {inst.status !== "paid" && selectedAssessment.balance > 0 && (
                                <Button size="sm" onClick={() => openPayForm(inst.index)} className="gap-1 text-[11px] px-2 py-1">
                                  Pay
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pay button (for full-payment plans or direct payment) */}
                {selectedAssessment.balance > 0 && (
                  <div className="flex justify-end">
                    <Button onClick={() => openPayForm()} className="gap-1.5">
                      <HiOutlineBanknotes className="h-4 w-4" />
                      Record Payment
                    </Button>
                  </div>
                )}

                {/* Payment History */}
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className="bg-gray-50/80 px-5 py-3 border-b border-gray-100">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-600">
                      Payment History ({selectedAssessment.payments?.length || 0} records)
                    </p>
                  </div>
                  {!selectedAssessment.payments || selectedAssessment.payments.length === 0 ? (
                    <div className="py-10 text-center">
                      <HiOutlineClock className="mx-auto h-8 w-8 text-gray-300" />
                      <p className="mt-2 text-sm text-gray-500">No payments recorded yet</p>
                    </div>
                  ) : (
                    <table className="min-w-full">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-wider text-gray-600 border-b border-gray-100">
                          <th className="px-4 py-2 text-left font-semibold">Date</th>
                          <th className="px-4 py-2 text-left font-semibold">OR No.</th>
                          <th className="px-4 py-2 text-left font-semibold">Method</th>
                          {hasInstallments && <th className="px-4 py-2 text-left font-semibold">Installment</th>}
                          <th className="px-4 py-2 text-right font-semibold w-28">Amount</th>
                          <th className="px-4 py-2 text-left font-semibold">Remarks</th>
                          <th className="px-4 py-2 w-10" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {selectedAssessment.payments.map((payment: any) => (
                          <tr key={payment.id} className="text-sm hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{formatDate(payment.created_at)}</td>
                            <td className="px-4 py-2.5 text-gray-700 font-medium">{payment.or_number || "—"}</td>
                            <td className="px-4 py-2.5">
                              <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700 capitalize">
                                {payment.payment_method?.replace("_", " ")}
                              </span>
                            </td>
                            {hasInstallments && (
                              <td className="px-4 py-2.5 text-gray-600 text-xs">
                                {payment.installment_index != null
                                  ? `#${payment.installment_index + 1} — ${installments[payment.installment_index]?.label || ""}`
                                  : "—"}
                              </td>
                            )}
                            <td className="px-4 py-2.5 text-right font-semibold text-green-700">{formatCurrency(payment.amount)}</td>
                            <td className="px-4 py-2.5 text-gray-500 text-xs max-w-[150px] truncate">{payment.remarks || "—"}</td>
                            <td className="px-4 py-2.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => openAssessmentReceipt(payment)} className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition" title="Print receipt">
                                  <HiOutlinePrinter className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => handleDeletePayment(payment.id)} className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-red-50 hover:text-red-500 transition" title="Delete payment">
                                  <HiOutlineTrash className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50/60 border-t border-gray-200">
                          <td colSpan={hasInstallments ? 4 : 3} className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Total Paid</td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-green-700">{formatCurrency(selectedAssessment.total_paid)}</td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════
           OTHER PAYMENT TAB
           ═══════════════════════════════════════════════════ */
        <div>
          <div className="flex items-center justify-between mb-4">
            <div />
            <Button onClick={openOtherForm} className="gap-1.5">
              <HiOutlinePlus className="h-4 w-4" />
              New Other Payment
            </Button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-3 py-2.5">
              <div className="relative">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  value={otherFilterSearch}
                  onChange={(e) => setOtherFilterSearch(e.target.value)}
                  placeholder="Search student or description..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-8 py-2 text-sm placeholder:text-gray-500 focus:border-primary-500 focus:bg-white focus:ring-1 focus:ring-primary-500 outline-none transition"
                />
                {otherFilterSearch && (
                  <button onClick={() => setOtherFilterSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                    <HiOutlineXMark className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {otherLoading ? (
              <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-[3px] border-gray-200 border-t-primary-600" /></div>
            ) : filteredOtherPayments.length === 0 ? (
              <div className="py-12 text-center"><p className="text-sm text-gray-500">{otherFilterSearch ? "No matching records" : "No other payments yet"}</p></div>
            ) : (
              <table className="min-w-full">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-gray-600 border-b border-gray-100 bg-gray-50/50">
                    <th className="px-4 py-2 text-left font-semibold">Date</th>
                    <th className="px-4 py-2 text-left font-semibold">Student</th>
                    <th className="px-4 py-2 text-left font-semibold">Description</th>
                    <th className="px-4 py-2 text-left font-semibold">OR No.</th>
                    <th className="px-4 py-2 text-left font-semibold">Method</th>
                    <th className="px-4 py-2 text-right font-semibold w-28">Amount</th>
                    <th className="px-4 py-2 text-left font-semibold">Remarks</th>
                    <th className="px-4 py-2 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredOtherPayments.map((p: any) => (
                    <tr key={p.id} className="text-sm hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{formatDate(p.created_at)}</td>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-gray-800">{p.student?.last_name}, {p.student?.first_name}</p>
                        <p className="text-xs text-gray-500">{p.student?.student_no}</p>
                      </td>
                      <td className="px-4 py-2.5 text-gray-700 font-medium">{p.description || "—"}</td>
                      <td className="px-4 py-2.5 text-gray-600">{p.or_number || "—"}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700 capitalize">
                          {p.payment_method?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-green-700">{formatCurrency(p.amount)}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs max-w-[150px] truncate">{p.remarks || "—"}</td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openOtherReceipt(p)} className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition" title="Print receipt">
                            <HiOutlinePrinter className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDeleteOther(p.id)} className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-red-50 hover:text-red-500 transition" title="Delete">
                            <HiOutlineTrash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ═══ Assessment Payment Modal ═══ */}
      <Modal open={showPayForm} onClose={() => setShowPayForm(false)} title={payInstallmentIndex != null ? `Pay Installment #${payInstallmentIndex + 1}` : "Record Payment"}>
        <div className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {selectedAssessment && (
            <div className="rounded-lg bg-gray-50 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Student:</span>
                <span className="font-medium">{selectedAssessment.student?.last_name}, {selectedAssessment.student?.first_name}</span>
              </div>
              {payInstallmentIndex != null && installmentStatuses[payInstallmentIndex] && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Installment:</span>
                    <span className="font-medium">{installments[payInstallmentIndex]?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Installment Amount:</span>
                    <span className="font-medium">{formatCurrency(installments[payInstallmentIndex]?.amount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-1">
                    <span className="font-semibold text-gray-700">Remaining for this installment:</span>
                    <span className="font-bold text-red-700">{formatCurrency(installmentStatuses[payInstallmentIndex].remaining)}</span>
                  </div>
                </>
              )}
              {payInstallmentIndex == null && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Assessment:</span>
                    <span className="font-medium">{formatCurrency(selectedAssessment.total_fee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Paid:</span>
                    <span className="font-medium">{formatCurrency(selectedAssessment.total_paid)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-1">
                    <span className="font-semibold text-gray-700">Remaining Balance:</span>
                    <span className="font-bold text-red-700">{formatCurrency(selectedAssessment.balance)}</span>
                  </div>
                </>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Amount <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">₱</span>
                <input type="number" step="0.01" min={0} className="block w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2.5 text-sm text-right" placeholder="0.00" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={handlePayFull}>
                {payInstallmentIndex != null ? "Full Inst." : "Pay Full"}
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Payment Method</label>
            <select className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">OR Number</label>
            <input type="text" className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" placeholder="Official receipt number" value={payOrNumber} onChange={(e) => setPayOrNumber(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Received By</label>
            <input type="text" className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" placeholder="Name of cashier / receiver" value={payReceivedBy} onChange={(e) => setPayReceivedBy(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Remarks</label>
            <textarea className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" rows={2} placeholder="Optional notes" value={payRemarks} onChange={(e) => setPayRemarks(e.target.value)} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowPayForm(false)}>Cancel</Button>
            <Button type="button" onClick={handleSubmitPayment} loading={saving} disabled={!payAmount || Number(payAmount) <= 0} className="gap-1.5">
              <HiOutlineCheckCircle className="h-4 w-4" />
              Submit Payment
            </Button>
          </div>
        </div>
      </Modal>

      {/* ═══ Receipt ═══ */}
      {receiptPayment && receiptContext && (
        <PaymentReceipt
          payment={receiptPayment}
          student={receiptContext.student}
          course={receiptContext.course}
          semester={receiptContext.semester}
          schoolYear={receiptContext.schoolYear}
          assessment={receiptContext.assessment}
          installmentLabel={receiptContext.installmentLabel}
          onClose={() => { setReceiptPayment(null); setReceiptContext(null); }}
        />
      )}

      {/* ═══ Other Payment Modal ═══ */}
      <Modal open={showOtherForm} onClose={() => setShowOtherForm(false)} title="New Other Payment">
        <div className="space-y-4">
          {otherError && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{otherError}</div>}

          <SearchSelect
            label="Student"
            placeholder="Search student name or number..."
            options={studentOptions}
            value={otherStudentId}
            onChange={setOtherStudentId}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Description <span className="text-red-500">*</span></label>
            <input type="text" className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" placeholder="e.g. ID replacement, library fine, clearance fee" value={otherDescription} onChange={(e) => setOtherDescription(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Amount <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">₱</span>
              <input type="number" step="0.01" min={0} className="block w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2.5 text-sm text-right" placeholder="0.00" value={otherAmount} onChange={(e) => setOtherAmount(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Payment Method</label>
            <select className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" value={otherMethod} onChange={(e) => setOtherMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">OR Number</label>
            <input type="text" className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" placeholder="Official receipt number" value={otherOrNumber} onChange={(e) => setOtherOrNumber(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Received By</label>
            <input type="text" className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" placeholder="Name of cashier / receiver" value={otherReceivedBy} onChange={(e) => setOtherReceivedBy(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Remarks</label>
            <textarea className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" rows={2} placeholder="Optional notes" value={otherRemarks} onChange={(e) => setOtherRemarks(e.target.value)} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowOtherForm(false)}>Cancel</Button>
            <Button type="button" onClick={handleSubmitOther} loading={otherSaving} disabled={!otherStudentId || !otherAmount || Number(otherAmount) <= 0 || !otherDescription.trim()} className="gap-1.5">
              <HiOutlineCheckCircle className="h-4 w-4" />
              Submit Payment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
