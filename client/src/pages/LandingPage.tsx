import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineAcademicCap,
  HiOutlineSparkles,
  HiOutlineStar,
  HiOutlineBookOpen,
  HiOutlineTrophy,
  HiOutlineUserGroup,
  HiOutlineBuildingLibrary,
  HiOutlineGlobeAlt,
  HiOutlineLightBulb,
  HiOutlineArrowRight,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineEye,
  HiOutlineFlag,
  HiOutlineQuestionMarkCircle,
} from "react-icons/hi2";
import type { Announcement, Highlight, CourseOffering, InstitutionSettings, HeroSlide, Faq } from "@shared/types";
import { applyThemeToDOM } from "../hooks/useTheme";

const BASE_URL = "/api";

async function publicFetch<T>(endpoint: string): Promise<T[]> {
  const res = await fetch(`${BASE_URL}/landing${endpoint}`);
  const data = await res.json();
  return data.data || [];
}

async function fetchInstitution(): Promise<InstitutionSettings | null> {
  try {
    const res = await fetch(`${BASE_URL}/landing/institution`);
    const data = await res.json();
    return data.data || null;
  } catch {
    return null;
  }
}

const ICON_MAP: Record<string, React.ReactNode> = {
  star: <HiOutlineStar className="h-8 w-8" />,
  academic: <HiOutlineAcademicCap className="h-8 w-8" />,
  book: <HiOutlineBookOpen className="h-8 w-8" />,
  trophy: <HiOutlineTrophy className="h-8 w-8" />,
  users: <HiOutlineUserGroup className="h-8 w-8" />,
  building: <HiOutlineBuildingLibrary className="h-8 w-8" />,
  globe: <HiOutlineGlobeAlt className="h-8 w-8" />,
  lightbulb: <HiOutlineLightBulb className="h-8 w-8" />,
  sparkles: <HiOutlineSparkles className="h-8 w-8" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-blue-100 text-blue-700",
  enrollment: "bg-green-100 text-green-700",
  academic: "bg-purple-100 text-purple-700",
  event: "bg-orange-100 text-orange-700",
};

// ─── Hero Banner ────────────────────────────────────────
function HeroBanner({ institutionName, logoPath, bannerPath }: { institutionName: string; logoPath: string | null; bannerPath: string | null }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 text-white min-h-[550px] sm:min-h-[600px] flex items-center">
      {/* Banner image or animated gradient background */}
      {bannerPath ? (
        <>
          <img src={bannerPath} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        </>
      ) : (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/5 animate-[pulse_8s_ease-in-out_infinite]" />
          <div className="absolute top-1/2 -left-16 h-72 w-72 rounded-full bg-white/5 animate-[pulse_6s_ease-in-out_infinite_1s]" />
          <div className="absolute -bottom-20 right-1/3 h-80 w-80 rounded-full bg-white/[0.03] animate-[pulse_10s_ease-in-out_infinite_2s]" />
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }} />
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-white/[0.06] to-transparent" />
        </div>
      )}

      <div className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
        <div className="text-center max-w-3xl mx-auto">
          {logoPath && (
            <img src={logoPath} alt="" className="mx-auto mb-8 h-24 w-24 rounded-2xl bg-white/10 p-2.5 object-contain backdrop-blur-sm ring-1 ring-white/20" />
          )}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm mb-8 ring-1 ring-white/20">
            <HiOutlineAcademicCap className="h-4 w-4" />
            Now accepting enrollees
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.08] drop-shadow-lg">
            Welcome to<br />
            <span className={bannerPath ? "text-white" : "bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent"}>
              {institutionName}
            </span>
          </h1>
          <p className="mt-6 text-lg text-white/80 sm:text-xl leading-relaxed max-w-2xl mx-auto drop-shadow">
            Empowering students with quality education and opportunities for growth. Start your academic journey with us today.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-primary-700 shadow-lg shadow-black/20 hover:bg-primary-50 hover:shadow-xl transition-all"
            >
              <HiOutlineAcademicCap className="h-5 w-5" />
              Enroll Now
              <HiOutlineArrowRight className="h-4 w-4 -ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/25 px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/10 hover:border-white/40 transition-all backdrop-blur-sm"
            >
              Student Portal
              <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Campus Showcase Carousel ───────────────────────────
// A contained carousel (not the hero) used to showcase facilities, events, etc.
function ShowcaseCarousel({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (slides.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrent((prev) => (prev + 1) % slides.length);
      }, 5000);
    }
  }, [slides.length]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer]);

  const goTo = (idx: number) => { setCurrent(idx); resetTimer(); };
  const prev = () => { setCurrent((c) => (c - 1 + slides.length) % slides.length); resetTimer(); };
  const next = () => { setCurrent((c) => (c + 1) % slides.length); resetTimer(); };

  return (
    <div className="relative h-[360px] overflow-hidden rounded-3xl bg-gray-900 shadow-card sm:h-[440px] lg:h-[520px]">
      {/* Slides */}
      {slides.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
            idx === current ? "opacity-100 scale-100" : "opacity-0 scale-105"
          }`}
        >
          <img
            src={slide.image_path}
            alt={slide.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/5" />

          <div className="relative flex h-full items-end">
            <div className="w-full px-6 pb-14 sm:px-10 sm:pb-16 lg:px-12">
              <div className="max-w-2xl">
                <h3 className={`text-2xl font-bold text-white sm:text-3xl lg:text-4xl transition-all duration-700 delay-200 ${
                  idx === current ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                }`}>
                  {slide.title}
                </h3>
                {slide.subtitle && (
                  <p className={`mt-3 text-base text-gray-200 sm:text-lg transition-all duration-700 delay-300 ${
                    idx === current ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                  }`}>
                    {slide.subtitle}
                  </p>
                )}
                {slide.button_text && slide.button_link && (
                  <div className={`mt-5 transition-all duration-700 delay-[400ms] ${
                    idx === current ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                  }`}>
                    <Link
                      to={slide.button_link}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-primary-700 transition"
                    >
                      {slide.button_text}
                      <HiOutlineArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition"
          >
            <HiOutlineChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition"
          >
            <HiOutlineChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={`h-2.5 rounded-full transition-all ${
                idx === current ? "w-8 bg-white" : "w-2.5 bg-white/50 hover:bg-white/75"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Reusable Section Heading ───────────────────────────
function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-12 flex flex-col items-center text-center">
      <span className="eyebrow mb-4">{eyebrow}</span>
      <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl lg:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 max-w-2xl text-gray-600">{subtitle}</p>}
      <span className="mt-5 h-1 w-16 rounded-full bg-primary-600" />
    </div>
  );
}

// ─── FAQ Accordion ──────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-2xl border bg-white transition-all ${open ? "border-primary-200 shadow-sm" : "border-gray-100"}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="font-semibold text-gray-900">{q}</span>
        <HiOutlineChevronDown className={`h-5 w-5 shrink-0 text-primary-600 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-sm leading-relaxed text-gray-600">{a}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Landing Page ──────────────────────────────────
export function LandingPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [institution, setInstitution] = useState<InstitutionSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      publicFetch<HeroSlide>("/hero-slides"),
      publicFetch<Announcement>("/announcements"),
      publicFetch<Highlight>("/highlights"),
      publicFetch<CourseOffering>("/course-offerings"),
      publicFetch<Faq>("/faqs"),
      fetchInstitution(),
    ]).then(([sl, ann, hl, co, fq, inst]) => {
      setSlides(sl);
      setAnnouncements(ann);
      setHighlights(hl);
      setOfferings(co);
      setFaqs(fq);
      setInstitution(inst);
      if (inst?.primary_color && inst?.secondary_color) {
        applyThemeToDOM(inst.primary_color, inst.secondary_color);
      }
    }).finally(() => setLoading(false));
  }, []);

  const institutionName = institution?.name || "PDM Enrollment System";
  const logoPath = institution?.logo_path;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-white">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-gray-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {logoPath && (
              <img src={logoPath} alt="" className="h-10 w-10 rounded-lg object-contain" />
            )}
            <span className="text-lg font-bold text-primary-800">{institutionName}</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#announcements" className="hidden sm:inline-flex text-sm font-medium text-gray-600 hover:text-primary-600 transition">Announcements</a>
            <a href="#programs" className="hidden sm:inline-flex text-sm font-medium text-gray-600 hover:text-primary-600 transition">Programs</a>
            <Link to="/school-officials" className="hidden sm:inline-flex text-sm font-medium text-gray-600 hover:text-primary-600 transition">School Officials</Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 transition"
            >
              Sign In
              <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <HeroBanner institutionName={institutionName} logoPath={logoPath} bannerPath={institution?.banner_path || null} />

      {/* Campus Showcase Section (Hero Slides) */}
      {slides.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Explore Our Campus" title="What we have to offer" subtitle="Take a closer look at our facilities, events, and campus life" />
            <ShowcaseCarousel slides={slides} />
          </div>
        </section>
      )}

      {/* Highlights Section */}
      {highlights.length > 0 && (
        <section className="bg-gray-50 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Why Choose Us" title="Built for your success" subtitle="Discover what makes our institution stand out" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {highlights.map((hl) => (
                <div
                  key={hl.id}
                  className="group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-md hover:border-primary-200 transition-all"
                >
                  <div className="mb-4 inline-flex rounded-xl bg-primary-50 p-3 text-primary-600 group-hover:bg-primary-100 transition">
                    {ICON_MAP[hl.icon] || ICON_MAP.star}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{hl.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{hl.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Vision & Mission Section */}
      {(institution?.vision || institution?.mission) && (
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Vision & Mission" title="What we stand for" subtitle="Our guiding principles and aspirations" />
            <div className={`grid gap-8 ${institution.vision && institution.mission ? "lg:grid-cols-2" : "max-w-3xl mx-auto"}`}>
              {institution.vision && (
                <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                      <HiOutlineEye className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-primary-800">Our Vision</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{institution.vision}</p>
                </div>
              )}
              {institution.mission && (
                <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                      <HiOutlineFlag className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-primary-800">Our Mission</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{institution.mission}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Announcements Section */}
      {announcements.length > 0 && (
        <section id="announcements" className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="News & Updates" title="Announcements" subtitle="Stay updated with the latest news and events" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {announcements.map((ann) => (
                <Link
                  key={ann.id}
                  to={`/announcements/${ann.id}`}
                  className={`group rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all overflow-hidden ${
                    ann.is_pinned ? "border-primary-200 ring-1 ring-primary-100" : "border-gray-100 hover:border-primary-200"
                  }`}
                >
                  {ann.image_path && (
                    <div className="h-40 overflow-hidden">
                      <img
                        src={ann.image_path}
                        alt={ann.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[ann.category] || CATEGORY_COLORS.general}`}>
                        {ann.category}
                      </span>
                      {ann.is_pinned && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Pinned
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-primary-700 transition">{ann.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{ann.content}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <HiOutlineClock className="h-3.5 w-3.5" />
                        {new Date(ann.published_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 opacity-0 group-hover:opacity-100 transition">
                        Read more
                        <HiOutlineArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Course Offerings Section */}
      {offerings.length > 0 && (
        <section id="programs" className="bg-gray-50 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Our Programs" title="Academic Programs" subtitle="Explore our degree programs and find the right fit for you" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {offerings.map((co) => (
                <Link
                  key={co.id}
                  to={`/programs/${co.id}`}
                  className={`group rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition-all ${
                    co.is_featured ? "border-primary-200 ring-1 ring-primary-100" : "border-gray-100 hover:border-primary-200"
                  }`}
                >
                  {co.is_featured && (
                    <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                      <HiOutlineSparkles className="h-3 w-3" />
                      Featured
                    </span>
                  )}
                  <div className="mb-3 inline-flex rounded-xl bg-primary-50 p-2.5 text-primary-600 group-hover:bg-primary-100 transition">
                    <HiOutlineAcademicCap className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {co.course_code}
                  </h3>
                  <p className="text-sm font-medium text-primary-600 mb-2">
                    {co.course_name}
                  </p>
                  {co.description_long && (
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-3">{co.description_long}</p>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                    <div className="flex flex-wrap gap-2">
                      {(co.degree_type || co.duration) && (
                        <>
                          {co.degree_type && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                              <HiOutlineAcademicCap className="h-3.5 w-3.5" />
                              {co.degree_type}
                            </span>
                          )}
                          {co.duration && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                              <HiOutlineCalendarDays className="h-3.5 w-3.5" />
                              {co.duration}
                            </span>
                          )}
                        </>
                      )}
                      {!co.degree_type && !co.duration && co.duration_years && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <HiOutlineCalendarDays className="h-3.5 w-3.5" />
                          {co.duration_years} year{co.duration_years > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 opacity-0 group-hover:opacity-100 transition">
                      View Details
                      <HiOutlineArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {faqs.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Got Questions?" title="Frequently asked questions" subtitle="Everything you need to know before you enroll" />
            <div className="space-y-4">
              {faqs.map((f) => (
                <FaqItem key={f.id} q={f.question} a={f.answer} />
              ))}
            </div>
            <p className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500">
              <HiOutlineQuestionMarkCircle className="h-5 w-5 text-primary-600" />
              Still have questions? Reach out to the registrar's office.
            </p>
          </div>
        </section>
      )}

      {/* Closing CTA Band */}
      <section className="px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 px-6 py-14 text-center sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-16 -right-10 h-64 w-64 rounded-full bg-white/5" />
            <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-white/5" />
          </div>
          <div className="relative">
            <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">Ready to start your journey?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/80">
              Join {institutionName} and take the next step toward your future. Enrollment is now open.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-primary-700 shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-primary-50 hover:shadow-xl"
              >
                <HiOutlineAcademicCap className="h-5 w-5" />
                Enroll Now
                <HiOutlineArrowRight className="h-4 w-4 -ml-1 opacity-0 -translate-x-2 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white/25 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/10"
              >
                Student Portal
                <HiOutlineArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              {logoPath && (
                <img src={logoPath} alt="" className="h-8 w-8 rounded-lg object-contain" />
              )}
              <span className="font-semibold text-gray-800">{institutionName}</span>
            </div>
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} {institutionName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
