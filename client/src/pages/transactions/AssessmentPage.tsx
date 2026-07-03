import { useState, useEffect, useMemo, useCallback } from "react";
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineCalculator,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineFunnel,
  HiOutlineBanknotes,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import { assessmentService, advisingService, schoolYearService, semesterService, miscellaneousFeeService } from "../../services/maintenanceService";
import { Button } from "../../components/ui/Button";
import { SearchSelect } from "../../components/ui/SearchSelect";
import { Modal } from "../../components/ui/Modal";
import type { SchoolYear, Semester } from "@shared/types";

type PaymentPlan = "full" | "2" | "3" | "4" | "flexible";

const PLAN_LABELS: Record<PaymentPlan, string> = {
  full: "Full Payment",
  "2": "Option A — 2 Payments",
  "3": "Option B — 3 Payments",
  "4": "Option C — 4 Payments",
  flexible: "Option D — Flexible",
};

function computeInstallments(
  plan: PaymentPlan,
  tuitionFee: number,
  miscFee: number,
  totalFee: number,
  config: { down_payment_2: number; down_payment_3: number; down_payment_4: number },
  flexibleAmounts?: number[]
): { label: string; amount: number }[] {
  if (plan === "full") {
    return [{ label: "Full Payment", amount: totalFee }];
  }

  if (plan === "flexible") {
    if (!flexibleAmounts || flexibleAmounts.length === 0) {
      return [{ label: "Payment 1", amount: totalFee }];
    }
    return flexibleAmounts.map((amt, i) => ({
      label: `Payment ${i + 1}`,
      amount: amt,
    }));
  }

  const numPayments = Number(plan);
  const dpKey = `down_payment_${numPayments}` as keyof typeof config;
  const dpPercent = config[dpKey] / 100;

  const firstTuition = Math.round(tuitionFee * dpPercent * 100) / 100;
  const remainingTuition = tuitionFee - firstTuition;
  const perSubsequent = Math.round((remainingTuition / (numPayments - 1)) * 100) / 100;

  const installments: { label: string; amount: number }[] = [];

  installments.push({
    label: "1st Payment (Misc + Tuition DP)",
    amount: Math.round((miscFee + firstTuition) * 100) / 100,
  });

  for (let i = 2; i <= numPayments; i++) {
    const isLast = i === numPayments;
    const amt = isLast
      ? Math.round((remainingTuition - perSubsequent * (numPayments - 2)) * 100) / 100
      : perSubsequent;
    installments.push({
      label: `${i}${i === 2 ? "nd" : i === 3 ? "rd" : "th"} Payment`,
      amount: amt,
    });
  }

  return installments;
}

export function AssessmentPage() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSearch, setFilterSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [advisings, setAdvisings] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [allMiscFees, setAllMiscFees] = useState<any[]>([]);

  const [selectedAdvisingId, setSelectedAdvisingId] = useState<number>(0);
  const [computedAssessment, setComputedAssessment] = useState<any | null>(null);
  const [computing, setComputing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAddMisc, setShowAddMisc] = useState(false);
  const [addMiscFeeId, setAddMiscFeeId] = useState<number>(0);
  const [addMiscQty, setAddMiscQty] = useState<number>(1);

  // Installment state
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlan>("full");
  const [flexibleRows, setFlexibleRows] = useState<number[]>([]);

  const [selectedAssessment, setSelectedAssessment] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchAssessments();
    advisingService.getAll().then((r) => setAdvisings(r.data || []));
    semesterService.getAll().then((r) => setSemesters(r.data || []));
    schoolYearService.getAll().then((r) => setSchoolYears(r.data || []));
    miscellaneousFeeService.getAll().then((r) => setAllMiscFees(r.data || []));
  }, []);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const res = await assessmentService.getAll();
      setAssessments(res.data || []);
    } finally { setLoading(false); }
  };

  const eligibleAdvisings = useMemo(() => {
    const assessedAdvisingIds = new Set(assessments.map((a: any) => a.advising_id));
    return advisings.filter((a: any) => a.status === "approved" && !assessedAdvisingIds.has(a.id));
  }, [advisings, assessments]);

  const advisingOptions = useMemo(() =>
    eligibleAdvisings.map((a: any) => ({
      value: a.id,
      label: `${a.student?.last_name}, ${a.student?.first_name}`,
      sublabel: `${a.student?.student_no} — ${a.course?.code} | ${a.semester?.name} SY ${a.school_year?.year_start}-${a.school_year?.year_end}`,
    })),
    [eligibleAdvisings]
  );

  const filteredAssessments = useMemo(() => {
    if (!filterSearch.trim()) return assessments;
    const q = filterSearch.toLowerCase();
    return assessments.filter((a: any) =>
      a.student?.last_name?.toLowerCase().includes(q) ||
      a.student?.first_name?.toLowerCase().includes(q) ||
      a.student?.student_no?.toLowerCase().includes(q)
    );
  }, [assessments, filterSearch]);

  useEffect(() => {
    if (selectedAdvisingId) {
      setComputing(true);
      setError(null);
      setComputedAssessment(null);
      setPaymentPlan("full");
      setFlexibleRows([]);
      assessmentService.compute(selectedAdvisingId)
        .then((res) => setComputedAssessment(res.data))
        .catch((err) => setError(err instanceof Error ? err.message : "Failed to compute assessment"))
        .finally(() => setComputing(false));
    } else {
      setComputedAssessment(null);
    }
  }, [selectedAdvisingId]);

  const recalcTotals = useCallback((assessment: any) => {
    const items = assessment.items || [];
    const tuitionTotal = items.filter((i: any) => i.type === "tuition").reduce((s: number, i: any) => s + i.total, 0);
    const miscTotal = items.filter((i: any) => i.type === "miscellaneous").reduce((s: number, i: any) => s + i.total, 0);
    return {
      ...assessment,
      tuition_fee: tuitionTotal,
      misc_fee: miscTotal,
      total_fee: tuitionTotal + miscTotal,
    };
  }, []);

  const handleRemoveItem = (idx: number) => {
    if (!computedAssessment) return;
    const item = computedAssessment.items[idx];
    if (item.type === "tuition") return;
    const newItems = [...computedAssessment.items];
    newItems.splice(idx, 1);
    setComputedAssessment(recalcTotals({ ...computedAssessment, items: newItems }));
  };

  const handleAddMiscFee = () => {
    if (!computedAssessment || !addMiscFeeId) return;
    const fee = allMiscFees.find((f: any) => f.id === addMiscFeeId);
    if (!fee) return;
    const quantity = Math.max(1, addMiscQty);
    const total = Number(fee.amount) * quantity;
    const newItem = {
      type: "miscellaneous",
      name: fee.name,
      amount: Number(fee.amount),
      quantity,
      total,
      description: quantity > 1 ? `Manually added (${quantity}x)` : "Manually added",
    };
    const newItems = [...computedAssessment.items, newItem];
    setComputedAssessment(recalcTotals({ ...computedAssessment, items: newItems }));
    setShowAddMisc(false);
    setAddMiscFeeId(0);
    setAddMiscQty(1);
  };

  // Installment computation
  const installmentConfig = computedAssessment?.installment_config || { down_payment_2: 60, down_payment_3: 40, down_payment_4: 30 };

  const installments = useMemo(() => {
    if (!computedAssessment) return [];
    return computeInstallments(
      paymentPlan,
      computedAssessment.tuition_fee,
      computedAssessment.misc_fee,
      computedAssessment.total_fee,
      installmentConfig,
      paymentPlan === "flexible" ? flexibleRows : undefined
    );
  }, [computedAssessment, paymentPlan, installmentConfig, flexibleRows]);

  const handlePlanChange = (plan: PaymentPlan) => {
    setPaymentPlan(plan);
    if (plan === "flexible" && computedAssessment) {
      setFlexibleRows([computedAssessment.total_fee]);
    }
  };

  const addFlexibleRow = () => {
    setFlexibleRows((prev) => [...prev, 0]);
  };

  const removeFlexibleRow = (idx: number) => {
    if (flexibleRows.length <= 1) return;
    setFlexibleRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateFlexibleRow = (idx: number, value: number) => {
    setFlexibleRows((prev) => prev.map((v, i) => (i === idx ? value : v)));
  };

  const flexibleTotal = flexibleRows.reduce((s, v) => s + v, 0);
  const flexibleDiff = computedAssessment ? Math.round((computedAssessment.total_fee - flexibleTotal) * 100) / 100 : 0;

  const handleSave = async () => {
    if (!computedAssessment) return;
    if (paymentPlan === "flexible" && Math.abs(flexibleDiff) > 0.01) {
      setError("Flexible payment amounts must equal the total assessment.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await assessmentService.create({
        ...computedAssessment,
        payment_plan: paymentPlan,
        installments,
      });
      setShowForm(false);
      fetchAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save assessment");
    } finally { setSaving(false); }
  };

  const viewDetail = async (assessment: any) => {
    setDetailLoading(true);
    try {
      const res = await assessmentService.getById(assessment.id);
      setSelectedAssessment(res.data);
    } catch { setSelectedAssessment(null); }
    finally { setDetailLoading(false); }
  };

  const handleDelete = async (assessment: any) => {
    const name = `${assessment.student?.last_name}, ${assessment.student?.first_name}`;
    if (!confirm(`Delete assessment for ${name}?`)) return;
    try {
      await assessmentService.remove(assessment.id);
      if (selectedAssessment?.id === assessment.id) setSelectedAssessment(null);
      fetchAssessments();
    } catch (err) { alert(err instanceof Error ? err.message : "Failed to delete"); }
  };

  const openNewAssessment = () => {
    setSelectedAdvisingId(0);
    setComputedAssessment(null);
    setPaymentPlan("full");
    setFlexibleRows([]);
    setError(null);
    setShowForm(true);
  };

  const formatCurrency = (amount: number) => `₱ ${Number(amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

  const availableMiscFees = useMemo(() => {
    if (!computedAssessment) return allMiscFees;
    const existingNames = new Set(
      computedAssessment.items
        .filter((i: any) => i.type === "miscellaneous")
        .map((i: any) => i.name)
    );
    return allMiscFees.filter((f: any) => !existingNames.has(f.name));
  }, [allMiscFees, computedAssessment]);

  const selectedAddFee = useMemo(() => allMiscFees.find((f: any) => f.id === addMiscFeeId), [allMiscFees, addMiscFeeId]);

  // ─── NEW ASSESSMENT FORM ──────────────────────────────
  if (showForm) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">New Assessment</h1>
            <p className="mt-0.5 text-sm text-gray-600">Select an approved advising record to compute fees</p>
          </div>
          <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
        </div>

        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 mb-6">
          <SearchSelect
            label="Advising Record"
            placeholder="Search student name or number..."
            options={advisingOptions}
            value={selectedAdvisingId}
            onChange={setSelectedAdvisingId}
            required
          />
          {eligibleAdvisings.length === 0 && (
            <p className="mt-2 text-xs text-amber-600">No approved advising records available for assessment.</p>
          )}
        </div>

        {computing ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-primary-600" />
          </div>
        ) : computedAssessment ? (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tuition Fee</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{formatCurrency(computedAssessment.tuition_fee)}</p>
                <p className="mt-0.5 text-xs text-gray-500">{computedAssessment.total_units} units total</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Miscellaneous Fees</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{formatCurrency(computedAssessment.misc_fee)}</p>
                <p className="mt-0.5 text-xs text-gray-500">{computedAssessment.items.filter((i: any) => i.type === "miscellaneous").length} item(s)</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 shadow-sm p-4">
                <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Total Assessment</p>
                <p className="mt-1 text-xl font-bold text-emerald-800">{formatCurrency(computedAssessment.total_fee)}</p>
                <p className="mt-0.5 text-xs text-emerald-600">Grand total to pay</p>
              </div>
            </div>

            {/* Fee Breakdown Table */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between bg-gray-50/80 px-5 py-3 border-b border-gray-100">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-600">Fee Breakdown</p>
                <button
                  onClick={() => { setAddMiscFeeId(0); setAddMiscQty(1); setShowAddMisc(true); }}
                  className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  <HiOutlinePlus className="h-3.5 w-3.5" />
                  Add Misc Fee
                </button>
              </div>
              <table className="min-w-full">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-gray-600 border-b border-gray-100">
                    <th className="px-5 py-2 text-left font-semibold">Type</th>
                    <th className="px-4 py-2 text-left font-semibold">Description</th>
                    <th className="px-4 py-2 text-right font-semibold w-24">Amount</th>
                    <th className="px-4 py-2 text-center font-semibold w-14">Qty</th>
                    <th className="px-4 py-2 text-right font-semibold w-28">Total</th>
                    <th className="px-4 py-2 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {computedAssessment.items.map((item: any, idx: number) => (
                    <tr key={idx} className="text-sm hover:bg-gray-50/50 transition-colors group">
                      <td className="px-5 py-2.5">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          item.type === "tuition" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
                        }`}>
                          {item.type === "tuition" ? "Tuition" : "Misc"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-gray-800">{item.name}</p>
                        {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{formatCurrency(item.amount)}</td>
                      <td className="px-4 py-2.5 text-center text-gray-500">{item.quantity}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-gray-800">{formatCurrency(item.total)}</td>
                      <td className="px-4 py-2.5 text-center">
                        {item.type === "miscellaneous" && (
                          <button
                            onClick={() => handleRemoveItem(idx)}
                            className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-red-50 hover:text-red-500 transition"
                            title="Remove fee"
                          >
                            <HiOutlineTrash className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50/60 border-t border-gray-200">
                    <td colSpan={5} className="px-5 py-3 text-right text-sm font-semibold text-gray-600">Grand Total</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-emerald-700">{formatCurrency(computedAssessment.total_fee)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Payment Plan Selection */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-gray-50/80 px-5 py-3 border-b border-gray-100">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-600">Payment Plan</p>
              </div>
              <div className="p-5">
                {/* Plan Options */}
                <div className="grid grid-cols-5 gap-2 mb-5">
                  {(["full", "2", "3", "4", "flexible"] as PaymentPlan[]).map((plan) => {
                    const isActive = paymentPlan === plan;
                    return (
                      <button
                        key={plan}
                        type="button"
                        onClick={() => handlePlanChange(plan)}
                        className={`rounded-lg border-2 px-3 py-2.5 text-center transition ${
                          isActive
                            ? "border-primary-500 bg-primary-50 text-primary-700"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <p className={`text-xs font-semibold ${isActive ? "text-primary-700" : "text-gray-800"}`}>
                          {plan === "full" ? "Full" : plan === "flexible" ? "Flexible" : `${plan} Payments`}
                        </p>
                        <p className={`text-[10px] mt-0.5 ${isActive ? "text-primary-600" : "text-gray-500"}`}>
                          {plan === "full" ? "Pay all now" : plan === "flexible" ? "Custom split" : `Option ${plan === "2" ? "A" : plan === "3" ? "B" : "C"}`}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Installment Breakdown */}
                {paymentPlan === "flexible" ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-800">Custom Payment Schedule</p>
                      <button
                        type="button"
                        onClick={addFlexibleRow}
                        className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-800 transition"
                      >
                        <HiOutlinePlus className="h-3.5 w-3.5" />
                        Add Payment
                      </button>
                    </div>
                    <div className="space-y-2">
                      {flexibleRows.map((amt, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-600 w-24 shrink-0">Payment {idx + 1}</span>
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">₱</span>
                            <input
                              type="number"
                              step="0.01"
                              min={0}
                              className="block w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2 text-sm text-right"
                              value={amt || ""}
                              onChange={(e) => updateFlexibleRow(idx, Number(e.target.value) || 0)}
                            />
                          </div>
                          {flexibleRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeFlexibleRow(idx)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 transition"
                            >
                              <HiOutlineTrash className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5 border border-gray-200">
                      <span className="text-sm font-medium text-gray-600">Total of payments:</span>
                      <span className={`text-sm font-bold ${Math.abs(flexibleDiff) < 0.01 ? "text-emerald-700" : "text-red-600"}`}>
                        {formatCurrency(flexibleTotal)}
                        {Math.abs(flexibleDiff) >= 0.01 && (
                          <span className="ml-2 text-xs font-normal">
                            ({flexibleDiff > 0 ? `₱${flexibleDiff.toFixed(2)} remaining` : `₱${Math.abs(flexibleDiff).toFixed(2)} over`})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <table className="min-w-full">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-wider text-gray-600 bg-gray-50 border-b border-gray-100">
                          <th className="px-4 py-2 text-left font-semibold">#</th>
                          <th className="px-4 py-2 text-left font-semibold">Description</th>
                          <th className="px-4 py-2 text-right font-semibold">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {installments.map((inst, idx) => (
                          <tr key={idx} className="text-sm">
                            <td className="px-4 py-2.5 text-gray-500 font-medium">{idx + 1}</td>
                            <td className="px-4 py-2.5 text-gray-800 font-medium">{inst.label}</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{formatCurrency(inst.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      {paymentPlan !== "full" && (
                        <tfoot>
                          <tr className="bg-gray-50 border-t border-gray-200">
                            <td colSpan={2} className="px-4 py-2 text-right text-xs text-gray-500">
                              1st payment includes all miscellaneous fees ({formatCurrency(computedAssessment.misc_fee)}) + {installmentConfig[`down_payment_${paymentPlan}` as keyof typeof installmentConfig]}% of tuition
                            </td>
                            <td className="px-4 py-2 text-right text-xs font-bold text-gray-700">{formatCurrency(computedAssessment.total_fee)}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Save button */}
            <div className="flex justify-end">
              <Button onClick={handleSave} loading={saving} className="gap-1.5">
                <HiOutlineCheckCircle className="h-4 w-4" />
                Save Assessment
              </Button>
            </div>
          </div>
        ) : selectedAdvisingId && !computing ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
            <HiOutlineCalculator className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-3 text-sm text-gray-500">Unable to compute assessment. Check tuition rates and fee setup.</p>
          </div>
        ) : null}

        <Modal open={showAddMisc} onClose={() => setShowAddMisc(false)} title="Add Miscellaneous Fee">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Fee <span className="text-red-500">*</span></label>
              <select
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                value={addMiscFeeId}
                onChange={(e) => setAddMiscFeeId(Number(e.target.value))}
              >
                <option value={0}>Select a miscellaneous fee</option>
                {availableMiscFees.map((f: any) => (
                  <option key={f.id} value={f.id}>
                    {f.name} — ₱{Number(f.amount).toFixed(2)}
                  </option>
                ))}
              </select>
              {availableMiscFees.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">All available fees have been added.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Quantity</label>
              <input
                type="number"
                min={1}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                value={addMiscQty}
                onChange={(e) => setAddMiscQty(Math.max(1, Number(e.target.value)))}
              />
            </div>

            {selectedAddFee && (
              <div className="rounded-lg bg-gray-50 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount per unit:</span>
                  <span className="font-medium">{formatCurrency(selectedAddFee.amount)}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium">{addMiscQty}</span>
                </div>
                <div className="flex justify-between mt-1 border-t border-gray-200 pt-1">
                  <span className="font-semibold text-gray-700">Total:</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(Number(selectedAddFee.amount) * addMiscQty)}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowAddMisc(false)}>Cancel</Button>
              <Button type="button" onClick={handleAddMiscFee} disabled={!addMiscFeeId}>Add Fee</Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // ─── LIST + DETAIL VIEW ────────────────────────────────
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Assessment</h1>
          <p className="mt-0.5 text-sm text-gray-600">Student fee assessment — tuition and miscellaneous fees</p>
        </div>
        <Button onClick={openNewAssessment} className="gap-1.5">
          <HiOutlinePlus className="h-4 w-4" />
          New Assessment
        </Button>
      </div>

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
              <div className="flex justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-gray-200 border-t-primary-600" />
              </div>
            ) : filteredAssessments.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-500">
                  {filterSearch ? "No matching records" : "No assessments yet"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[calc(100vh-320px)] overflow-y-auto scrollbar-thin">
                {filteredAssessments.map((assessment: any) => {
                  const isSelected = selectedAssessment?.id === assessment.id;
                  return (
                    <div
                      key={assessment.id}
                      className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition ${
                        isSelected
                          ? "bg-primary-50 border-l-[3px] border-l-primary-600"
                          : "hover:bg-gray-50 border-l-[3px] border-l-transparent"
                      }`}
                      onClick={() => viewDetail(assessment)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isSelected ? "text-primary-700" : "text-gray-800"}`}>
                          {assessment.student?.last_name}, {assessment.student?.first_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {assessment.student?.student_no} — {assessment.course?.code}
                        </p>
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
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-semibold text-emerald-700">{formatCurrency(assessment.total_fee)}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(assessment); }}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-red-50 hover:text-red-500 transition"
                          title="Delete"
                        >
                          <HiOutlineTrash className="h-3.5 w-3.5" />
                        </button>
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
              <HiOutlineBanknotes className="h-10 w-10 text-gray-400" />
              <p className="mt-3 text-sm text-gray-500">Select an assessment to view fee breakdown</p>
            </div>
          ) : detailLoading ? (
            <div className="flex justify-center rounded-xl border border-gray-200 bg-white py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-primary-600" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {selectedAssessment.student?.last_name}, {selectedAssessment.student?.first_name} {selectedAssessment.student?.middle_name || ""}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedAssessment.student?.student_no} — {selectedAssessment.course?.code}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedAssessment.payment_plan && selectedAssessment.payment_plan !== "full" && (
                      <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                        {selectedAssessment.payment_plan === "flexible" ? "Flexible" : `${selectedAssessment.payment_plan}-Payment Plan`}
                      </span>
                    )}
                    <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 capitalize">
                      {selectedAssessment.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">Semester:</span>
                    <span className="font-medium">{selectedAssessment.semester?.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">SY:</span>
                    <span className="font-medium">{selectedAssessment.school_year?.year_start}-{selectedAssessment.school_year?.year_end}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">Units:</span>
                    <span className="font-bold text-gray-800">{selectedAssessment.total_units}</span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tuition</p>
                  <p className="mt-1 text-lg font-bold text-gray-900">{formatCurrency(selectedAssessment.tuition_fee)}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Miscellaneous</p>
                  <p className="mt-1 text-lg font-bold text-gray-900">{formatCurrency(selectedAssessment.misc_fee)}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 shadow-sm p-4">
                  <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Total</p>
                  <p className="mt-1 text-lg font-bold text-emerald-800">{formatCurrency(selectedAssessment.total_fee)}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="bg-gray-50/80 px-4 py-2.5 border-b border-gray-100">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-600">
                    Fee Breakdown ({selectedAssessment.items?.length || 0} items)
                  </p>
                </div>
                <table className="min-w-full">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-gray-600 border-b border-gray-100">
                      <th className="px-4 py-2 text-left font-semibold">Type</th>
                      <th className="px-4 py-2 text-left font-semibold">Description</th>
                      <th className="px-4 py-2 text-right font-semibold w-24">Amount</th>
                      <th className="px-4 py-2 text-center font-semibold w-14">Qty</th>
                      <th className="px-4 py-2 text-right font-semibold w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {selectedAssessment.items?.map((item: any) => (
                      <tr key={item.id} className="text-sm hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            item.type === "tuition" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
                          }`}>
                            {item.type === "tuition" ? "Tuition" : "Misc"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-gray-800">{item.name}</p>
                          {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-600">{formatCurrency(item.amount)}</td>
                        <td className="px-4 py-2.5 text-center text-gray-500">{item.quantity}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-gray-800">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50/60 border-t border-gray-200">
                      <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Grand Total</td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-emerald-700">{formatCurrency(selectedAssessment.total_fee)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Installment Schedule (detail view) */}
              {selectedAssessment.installments && selectedAssessment.installments.length > 0 && selectedAssessment.payment_plan !== "full" && (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className="bg-gray-50/80 px-4 py-2.5 border-b border-gray-100">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-600">
                      Payment Schedule ({selectedAssessment.installments.length} installments)
                    </p>
                  </div>
                  <table className="min-w-full">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-gray-600 bg-gray-50 border-b border-gray-100">
                        <th className="px-4 py-2 text-left font-semibold">#</th>
                        <th className="px-4 py-2 text-left font-semibold">Description</th>
                        <th className="px-4 py-2 text-right font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedAssessment.installments.map((inst: any, idx: number) => (
                        <tr key={idx} className="text-sm">
                          <td className="px-4 py-2.5 text-gray-500 font-medium">{idx + 1}</td>
                          <td className="px-4 py-2.5 text-gray-800 font-medium">{inst.label}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{formatCurrency(inst.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
