import { useState, useEffect, useRef } from "react";
import { useTheme } from "../../hooks/useTheme";
import { institutionService } from "../../services/maintenanceService";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";

const PRESET_COLORS = [
  { label: "Blue", primary: "#2563eb", secondary: "#1e40af" },
  { label: "Indigo", primary: "#4f46e5", secondary: "#3730a3" },
  { label: "Purple", primary: "#7c3aed", secondary: "#5b21b6" },
  { label: "Pink", primary: "#db2777", secondary: "#9d174d" },
  { label: "Red", primary: "#dc2626", secondary: "#991b1b" },
  { label: "Orange", primary: "#ea580c", secondary: "#9a3412" },
  { label: "Amber", primary: "#d97706", secondary: "#92400e" },
  { label: "Green", primary: "#16a34a", secondary: "#15803d" },
  { label: "Teal", primary: "#0d9488", secondary: "#115e59" },
  { label: "Cyan", primary: "#0891b2", secondary: "#155e75" },
  { label: "Slate", primary: "#475569", secondary: "#1e293b" },
  { label: "Maroon", primary: "#7f1d1d", secondary: "#450a0a" },
];

export function InstitutionSettingsPage() {
  const { settings, refresh } = useTheme();
  const [name, setName] = useState("");
  const [acronym, setAcronym] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [secondaryColor, setSecondaryColor] = useState("#1e40af");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [vision, setVision] = useState("");
  const [mission, setMission] = useState("");
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setName(settings.name);
      setAcronym((settings as any).acronym || "");
      setPrimaryColor(settings.primary_color);
      setSecondaryColor(settings.secondary_color);
      setVision(settings.vision || "");
      setMission(settings.mission || "");
      if (settings.logo_path) {
        setLogoPreview(settings.logo_path);
      }
      setBannerPreview(settings.banner_path || null);
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await institutionService.update({ name, acronym, primary_color: primaryColor, secondary_color: secondaryColor, vision: vision || null, mission: mission || null });
      await refresh();
      setMessage({ type: "success", text: "Settings saved successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    setMessage(null);
    try {
      const res = await institutionService.uploadLogo(file);
      if (res.success) {
        await refresh();
        setMessage({ type: "success", text: "Logo uploaded successfully!" });
      } else {
        setMessage({ type: "error", text: res.message || "Upload failed" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to upload logo" });
    } finally {
      setUploading(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setBannerPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploadingBanner(true);
    setMessage(null);
    try {
      const res = await institutionService.uploadBanner(file);
      if (res.success) {
        await refresh();
        setMessage({ type: "success", text: "Banner uploaded successfully!" });
      } else {
        setMessage({ type: "error", text: res.message || "Upload failed" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to upload banner" });
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleRemoveBanner = async () => {
    setMessage(null);
    try {
      await institutionService.removeBanner();
      setBannerPreview(null);
      await refresh();
      setMessage({ type: "success", text: "Banner removed." });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to remove banner" });
    }
  };

  const applyPreset = (preset: typeof PRESET_COLORS[0]) => {
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
  };

  return (
    <div>
      <PageHeader title="Institution Settings" subtitle="Customize your institution's identity and theme" />

      {message && (
        <div className={`mb-6 rounded-lg p-3 text-sm ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Column — Settings */}
        <div className="space-y-8">
          {/* Logo */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Logo</h3>
            <div className="flex items-center gap-6">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
                {logoPreview ? (
                  <img src={logoPreview.startsWith("data:") ? logoPreview : logoPreview} alt="Logo" className="h-full w-full object-contain p-1" />
                ) : (
                  <span className="text-3xl text-gray-400">?</span>
                )}
              </div>
              <div>
                <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.svg,.webp" onChange={handleLogoUpload} className="hidden" />
                <Button onClick={() => fileRef.current?.click()} loading={uploading} variant="secondary">
                  {logoPreview ? "Change Logo" : "Upload Logo"}
                </Button>
                <p className="mt-2 text-xs text-gray-500">PNG, JPG, SVG, or WebP. Max 2MB.</p>
              </div>
            </div>
          </div>

          {/* Banner */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Landing Page Banner</h3>
            <p className="text-xs text-gray-500 mb-4">This image will be used as the hero background on the public landing page. Recommended: 1920x600 or wider.</p>
            <div className="space-y-4">
              {bannerPreview && (
                <div className="relative overflow-hidden rounded-lg border border-gray-200">
                  <img
                    src={bannerPreview.startsWith("data:") ? bannerPreview : bannerPreview}
                    alt="Banner preview"
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute bottom-2 left-3 text-xs font-medium text-white/80">Current banner</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <input ref={bannerRef} type="file" accept=".png,.jpg,.jpeg,.webp" onChange={handleBannerUpload} className="hidden" />
                <Button onClick={() => bannerRef.current?.click()} loading={uploadingBanner} variant="secondary">
                  {bannerPreview ? "Change Banner" : "Upload Banner"}
                </Button>
                {bannerPreview && (
                  <Button onClick={handleRemoveBanner} variant="secondary" className="text-red-600 hover:text-red-700">
                    Remove
                  </Button>
                )}
              </div>
              {!bannerPreview && (
                <p className="text-xs text-gray-400">No banner uploaded. A gradient background will be used instead.</p>
              )}
            </div>
          </div>

          {/* Name & Acronym */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Institution Identity</h3>
            <div className="space-y-4">
              <Input
                label="Institution Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter institution name"
              />
              <div>
                <Input
                  label="Acronym"
                  value={acronym}
                  onChange={(e) => setAcronym(e.target.value.toUpperCase())}
                  placeholder="e.g. PDM"
                />
                <p className="mt-1 text-[11px] text-gray-500">Used in student number format: {acronym || "XXX"}-2026-000001</p>
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Theme Colors</h3>

            {/* Presets */}
            <p className="text-sm font-medium text-gray-700 mb-2">Presets</p>
            <div className="grid grid-cols-6 gap-2 mb-6">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  title={preset.label}
                  className={`group relative flex h-10 items-center justify-center rounded-lg border-2 transition ${
                    primaryColor === preset.primary ? "border-gray-900 shadow-md" : "border-transparent hover:border-gray-300"
                  }`}
                  style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` }}
                >
                  {primaryColor === preset.primary && (
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  <span className="absolute -bottom-5 text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition">{preset.label}</span>
                </button>
              ))}
            </div>

            {/* Custom pickers */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => /^#[0-9a-fA-F]{6}$/.test(e.target.value) && setPrimaryColor(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
                    maxLength={7}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => /^#[0-9a-fA-F]{6}$/.test(e.target.value) && setSecondaryColor(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Vision & Mission */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vision & Mission</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-800">Vision</label>
                <textarea
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm transition placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 leading-relaxed"
                  rows={4}
                  placeholder="Write your institution's vision statement..."
                  value={vision}
                  onChange={(e) => setVision(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-800">Mission</label>
                <textarea
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm transition placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 leading-relaxed"
                  rows={4}
                  placeholder="Write your institution's mission statement..."
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                />
              </div>
              <p className="text-xs text-gray-500">These will be displayed on the public landing page.</p>
            </div>
          </div>

          <Button onClick={handleSave} loading={saving} className="w-full">
            Save Settings
          </Button>
        </div>

        {/* Right Column — Live Preview */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h3>

            {/* Mini navbar preview */}
            <div className="rounded-lg overflow-hidden border border-gray-200">
              <div className="flex items-center gap-3 px-4 py-3" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                {logoPreview && (
                  <img
                    src={logoPreview.startsWith("data:") ? logoPreview : logoPreview}
                    alt=""
                    className="h-8 w-8 rounded object-contain bg-white/20 p-0.5"
                  />
                )}
                <span className="font-bold text-white text-sm">{name || "Institution Name"}</span>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="flex gap-2 mb-4">
                  <span className="rounded-md px-3 py-1.5 text-xs font-medium text-white" style={{ backgroundColor: primaryColor }}>Dashboard</span>
                  <span className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border">Enrollment</span>
                  <span className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border">Maintenance</span>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-3/4 rounded" style={{ backgroundColor: primaryColor, opacity: 0.2 }} />
                  <div className="h-3 w-1/2 rounded bg-gray-200" />
                  <div className="h-3 w-2/3 rounded bg-gray-200" />
                </div>
                <div className="mt-4 flex gap-2">
                  <button className="rounded-lg px-4 py-2 text-xs font-medium text-white" style={{ backgroundColor: primaryColor }}>Primary Button</button>
                  <button className="rounded-lg px-4 py-2 text-xs font-medium border" style={{ color: primaryColor, borderColor: primaryColor }}>Outline Button</button>
                </div>
              </div>
            </div>
          </div>

          {/* Login preview */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Login Page Preview</h3>
            <div className="rounded-lg overflow-hidden" style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}20)` }}>
              <div className="p-6 text-center">
                {logoPreview && (
                  <img
                    src={logoPreview.startsWith("data:") ? logoPreview : logoPreview}
                    alt=""
                    className="mx-auto mb-3 h-16 w-16 rounded-xl object-contain"
                  />
                )}
                <h4 className="font-bold" style={{ color: secondaryColor }}>{name || "Institution Name"}</h4>
                <p className="text-xs text-gray-500 mt-1">Student Enrollment System</p>
                <div className="mt-4 mx-auto max-w-[200px] space-y-2">
                  <div className="h-8 rounded border border-gray-300 bg-white" />
                  <div className="h-8 rounded border border-gray-300 bg-white" />
                  <div className="h-8 rounded-lg text-white text-xs flex items-center justify-center font-medium" style={{ backgroundColor: primaryColor }}>Sign In</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
