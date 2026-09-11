import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as Plus, f as ArrowRight } from "../_libs/lucide-react.mjs";
import { t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { i as useCurrentUserState, t as Button } from "./button-CcZhciIu.mjs";
import { i as StateBlock, r as Skeleton, t as AppHeader, u as listCourses } from "./state-block-Dz-W-6Yz.mjs";
import { n as Progress, t as Badge } from "./progress-BnGHJQ8F.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-0GE_gc6q.js
var import_jsx_runtime = require_jsx_runtime();
var LOOP = [
	"Upload",
	"Understand",
	"Verify",
	"Study",
	"Practice",
	"Assess",
	"Diagnose",
	"Adapt"
];
function Home() {
	const { user, isPending } = useCurrentUserState();
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-6xl px-4 py-10",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-10 w-48" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 grid gap-4 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-40 rounded-xl" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-40 rounded-xl" })]
			})]
		})]
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Landing, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CourseHome, {});
}
function Landing() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto max-w-3xl px-5 pb-20 pt-16 sm:pt-24",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs uppercase tracking-[0.18em] text-muted-foreground",
					children: "ApexStudy"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-4 font-serif text-4xl leading-[1.12] tracking-tight sm:text-5xl",
					children: "Turn the course you already have into a study system that knows you."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-5 max-w-xl text-base text-muted-foreground",
					children: "Not a chatbot. Not a quiz generator. ApexStudy maps your material, estimates what you understand, and decides what should happen next."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 flex flex-wrap gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						size: "lg",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/login",
							children: ["Give me your course", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						size: "lg",
						variant: "secondary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/login",
							children: "Sign in"
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "mt-14 flex flex-wrap gap-2",
					children: LOOP.map((step, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex h-9 items-center rounded-full bg-secondary px-3 text-xs text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mr-2 tabular-nums text-foreground/50",
							children: String(i + 1).padStart(2, "0")
						}), step]
					}, step))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "mt-16 grid gap-px overflow-hidden rounded-xl bg-border shadow-[var(--shadow-border)] sm:grid-cols-3",
					children: [
						{
							k: "Course model",
							v: "Chapters, topics, sources, and the pages they came from."
						},
						{
							k: "Learner model",
							v: "An evolving estimate from quizzes, mistakes, and study history."
						},
						{
							k: "Adaptation",
							v: "Given those two, the system answers: what next?"
						}
					].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-card p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-serif text-lg tracking-tight",
							children: item.k
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted-foreground",
							children: item.v
						})]
					}, item.k))
				})
			]
		})]
	});
}
function CourseHome() {
	const query = useQuery({
		queryKey: ["courses"],
		queryFn: () => listCourses()
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto max-w-6xl px-4 pb-20 pt-10",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-[0.18em] text-muted-foreground",
						children: "My courses"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 font-serif text-4xl tracking-tight",
						children: "Continue studying"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/courses/new",
						search: { sample: void 0 },
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "Add course"]
					})
				})]
			}), query.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 grid gap-4 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-44 rounded-xl" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-44 rounded-xl" })]
			}) : query.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-10",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StateBlock, {
					tone: "danger",
					title: "Could not load courses",
					body: "Sign in again if this persists, then retry.",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => void query.refetch(),
						children: "Try again"
					})
				})
			}) : query.data && query.data.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyCourses, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-8 grid gap-4 sm:grid-cols-2",
				children: query.data?.map((course) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "min-w-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CourseCardView, { course })
				}, course.id))
			})]
		})]
	});
}
function EmptyCourses() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StateBlock, {
			title: "Give me your course. I will help you master it.",
			body: "Upload a PDF or start with the sample CIT 102 pack — a 100-level Computer Fundamentals course mapped into chapters, topics, and source pages.",
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/courses/new",
					search: { sample: void 0 },
					children: "Add course"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				variant: "secondary",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/courses/new",
					search: { sample: 1 },
					children: "Use CIT 102 sample"
				})
			})] })
		})
	});
}
function CourseCardView({ course }) {
	const explored = course.topicCount ? Math.round(course.exploredCount / course.topicCount * 100) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/courses/$courseId",
		params: { courseId: String(course.id) },
		search: {
			mode: "study",
			topic: void 0
		},
		className: "block min-w-0 rounded-xl bg-card p-5 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-xs uppercase tracking-[0.16em] text-muted-foreground",
						children: course.code
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-1 font-serif text-2xl tracking-tight text-balance break-words",
						children: course.title
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
					className: "shrink-0",
					children: [explored, "% explored"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
				value: explored,
				className: "mt-5",
				"aria-label": `${course.title} explored`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex items-center justify-between gap-3 text-sm text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "min-w-0 truncate",
					children: course.lastTopicTitle ? `Last studied: ${course.lastTopicTitle}` : "Not started"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "inline-flex shrink-0 items-center gap-1 text-foreground",
					children: ["Continue ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3.5" })]
				})]
			})
		]
	});
}
//#endregion
export { Home as component };
