import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { l as FileText, n as Upload, u as Check } from "../_libs/lucide-react.mjs";
import { r as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as Route$1 } from "./router-CivmaWDa.mjs";
import { i as useCurrentUserState, n as cn, t as Button } from "./button-CcZhciIu.mjs";
import { f as renameCourse, i as StateBlock, l as getWorkspace, n as RedirectToSignIn, o as createCourseFromText, r as Skeleton, s as createSampleCourse, t as AppHeader } from "./state-block-Dz-W-6Yz.mjs";
import { t as Input } from "./input-DBWL437_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/new-BtywDSPN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Textarea = import_react.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		className: cn("flex min-h-32 w-full rounded-lg bg-secondary px-3 py-3 text-sm text-foreground shadow-[var(--shadow-border)] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40", className),
		ref,
		...props
	});
});
Textarea.displayName = "Textarea";
async function extractPdfText(file) {
	const pdfjs = await import("../_libs/pdfjs-dist.mjs").then((n) => n.t);
	const worker = await import("./pdf.worker.min-CA4SejP6.mjs");
	pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
	const data = await file.arrayBuffer();
	const doc = await pdfjs.getDocument({ data }).promise;
	const maxPages = Math.min(doc.numPages, 80);
	const parts = [];
	for (let i = 1; i <= maxPages; i += 1) {
		const text = (await (await doc.getPage(i)).getTextContent()).items.map((item) => "str" in item ? String(item.str) : "").join(" ").replace(/\s+/g, " ").trim();
		if (text) parts.push(`[[page ${i}]]\n${text}`);
	}
	return {
		text: parts.join("\n\n").slice(0, 12e4),
		pages: doc.numPages
	};
}
async function readCourseFile(file) {
	if (file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf") return extractPdfText(file);
	return {
		text: (await file.text()).slice(0, 12e4),
		pages: null
	};
}
var STEPS = [
	"Document processed",
	"Chapters detected",
	"Topics identified",
	"Concepts mapped",
	"Sources indexed",
	"Structure checked"
];
function formatBytes(n) {
	if (n < 1024) return `${n} B`;
	if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
	return `${(n / 1048576).toFixed(1)} MB`;
}
function NewCoursePage() {
	const { user, isPending } = useCurrentUserState();
	const search = Route$1.useSearch();
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-xl px-4 py-16",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-24" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-3 h-10 w-72" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-8 h-44 w-full rounded-xl" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-4 h-32 w-full rounded-lg" })
			]
		})]
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NewCourseForm, { autoSample: search.sample === 1 });
}
function NewCourseForm({ autoSample }) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [code, setCode] = (0, import_react.useState)("");
	const [title, setTitle] = (0, import_react.useState)("");
	const [paste, setPaste] = (0, import_react.useState)("");
	const [fileName, setFileName] = (0, import_react.useState)(null);
	const [stagedFile, setStagedFile] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [step, setStep] = (0, import_react.useState)(-1);
	const [formError, setFormError] = (0, import_react.useState)(null);
	const [workspace, setWorkspace] = (0, import_react.useState)(null);
	const [editCode, setEditCode] = (0, import_react.useState)("");
	const [editTitle, setEditTitle] = (0, import_react.useState)("");
	const autoStarted = (0, import_react.useRef)(false);
	async function runSample() {
		setBusy(true);
		setFormError(null);
		setStep(0);
		const timer = window.setInterval(() => {
			setStep((s) => s < STEPS.length - 1 ? s + 1 : s);
		}, 280);
		try {
			const { courseId } = await createSampleCourse();
			const ws = await getWorkspace({ data: { courseId } });
			if (!ws) throw new Error("Could not open the sample course");
			setWorkspace(ws);
			setEditCode(ws.course.code);
			setEditTitle(ws.course.title);
			setStep(STEPS.length - 1);
			await queryClient.invalidateQueries({ queryKey: ["courses"] });
		} catch (err) {
			const message = err instanceof Error ? err.message : "Could not create sample course";
			setFormError(message);
			toast.error(message);
			setStep(-1);
		} finally {
			window.clearInterval(timer);
			setBusy(false);
		}
	}
	(0, import_react.useEffect)(() => {
		if (!autoSample || autoStarted.current) return;
		autoStarted.current = true;
		runSample();
	}, [autoSample]);
	async function runFromText(text, sourceName, kind) {
		setBusy(true);
		setFormError(null);
		setStep(0);
		const timer = window.setInterval(() => {
			setStep((s) => s < STEPS.length - 1 ? s + 1 : s);
		}, 420);
		try {
			const result = await createCourseFromText({ data: {
				text,
				sourceName,
				kind,
				code: code || void 0,
				title: title || void 0
			} });
			if (!result.workspace) throw new Error("Could not map that course");
			setWorkspace(result.workspace);
			setEditCode(result.workspace.course.code);
			setEditTitle(result.workspace.course.title);
			setStep(STEPS.length - 1);
			await queryClient.invalidateQueries({ queryKey: ["courses"] });
		} catch (err) {
			const message = err instanceof Error ? err.message : "Could not process that material";
			setFormError(message);
			toast.error(message);
			setStep(-1);
		} finally {
			window.clearInterval(timer);
			setBusy(false);
		}
	}
	async function onFile(file) {
		if (!file) return;
		setFileName(file.name);
		setStagedFile(file);
		setFormError(null);
	}
	async function processStagedFile() {
		const file = stagedFile;
		if (!file || busy) return;
		try {
			const extracted = await readCourseFile(file);
			if (extracted.text.trim().length < 80) {
				const message = "I could not read enough text from that file.";
				setFormError(message);
				toast.error(message);
				return;
			}
			await runFromText(extracted.text, file.name, "upload");
		} catch (err) {
			const message = err instanceof Error ? err.message : "Could not read that file";
			setFormError(message);
			toast.error(message);
		}
	}
	if (workspace) {
		const topicCount = workspace.chapters.reduce((n, ch) => n + ch.topics.length, 0);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-h-dvh",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto max-w-xl px-4 py-10 pb-16",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-[0.18em] text-muted-foreground",
						children: "Course map"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 font-serif text-3xl tracking-tight",
						children: "This is how I understood your course."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 grid gap-3 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: editCode,
							onChange: (e) => setEditCode(e.target.value),
							"aria-label": "Course code"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: editTitle,
							onChange: (e) => setEditTitle(e.target.value),
							"aria-label": "Course title"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-4 text-sm text-muted-foreground",
						children: [
							workspace.chapters.length,
							" chapters · ",
							topicCount,
							" topics"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
						className: "mt-5 space-y-4",
						children: workspace.chapters.map((ch) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-pretty text-sm font-medium",
							children: ch.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-1 space-y-1 text-sm text-muted-foreground",
							children: ch.topics.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
								className: "break-words",
								children: t.title
							}, t.id))
						})] }, ch.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "w-full sm:w-auto",
							onClick: async () => {
								if (editCode !== workspace.course.code || editTitle !== workspace.course.title) await renameCourse({ data: {
									courseId: workspace.course.id,
									code: editCode,
									title: editTitle
								} });
								await navigate({
									to: "/courses/$courseId",
									params: { courseId: String(workspace.course.id) },
									search: {
										mode: "study",
										topic: void 0
									}
								});
							},
							children: "Looks right"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "w-full sm:w-auto",
							variant: "secondary",
							onClick: () => setWorkspace(null),
							children: "Start over"
						})]
					})
				]
			})]
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto max-w-xl px-4 py-10 pb-16",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs uppercase tracking-[0.18em] text-muted-foreground",
					children: "New course"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-serif text-3xl tracking-tight sm:text-4xl",
					children: "Give me your course. I will help you master it."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-pretty text-sm text-muted-foreground",
					children: "Upload a PDF or paste notes. I will extract structure, index sources, and open a study space."
				}),
				formError && step < 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-8",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StateBlock, {
						tone: "danger",
						title: "Could not map that course",
						body: formError,
						action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: () => setFormError(null),
							children: "Dismiss"
						})
					})
				}) : null,
				busy || step >= 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "mt-10 space-y-3",
					"aria-live": "polite",
					children: STEPS.map((label, i) => {
						const done = i <= step;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex min-h-11 items-center gap-3 text-sm",
							children: [done ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4 shrink-0 text-ok" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "size-4 shrink-0 rounded-full" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: done ? "text-foreground" : "text-muted-foreground",
								children: label
							})]
						}, label);
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 space-y-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-3 sm:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								placeholder: "Course code (CIT 102)",
								value: code,
								onChange: (e) => setCode(e.target.value),
								"aria-label": "Course code"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								placeholder: "Title (optional)",
								value: title,
								onChange: (e) => setTitle(e.target.value),
								"aria-label": "Course title"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl bg-card px-6 py-10 text-center shadow-[var(--shadow-border)] focus-within:ring-2 focus-within:ring-ring",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-6 text-muted-foreground" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-3 text-sm font-medium",
									children: stagedFile ? "Replace file" : "Upload PDF, text, or markdown"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-1 text-xs text-muted-foreground",
									children: stagedFile ? `${stagedFile.name} · ${formatBytes(stagedFile.size)}` : fileName ?? "The file is read in your browser. Only extracted text is stored."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "file",
									accept: ".pdf,.txt,.md,.markdown,application/pdf,text/plain",
									className: "sr-only",
									onChange: (e) => {
										onFile(e.target.files?.[0]);
										e.target.value = "";
									}
								})
							]
						}),
						stagedFile ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							"data-staged-file": stagedFile.name,
							className: "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "min-w-0 flex-1 text-sm text-muted-foreground",
									children: [
										"Ready to process ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium text-foreground",
											children: stagedFile.name
										}),
										" ",
										"(",
										formatBytes(stagedFile.size),
										"). Nothing has been indexed yet."
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									className: "w-full sm:w-auto",
									onClick: () => void processStagedFile(),
									children: "Process course"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									className: "w-full sm:w-auto",
									variant: "secondary",
									onClick: () => {
										setStagedFile(null);
										setFileName(null);
									},
									children: "Clear"
								})
							]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-2 text-xs uppercase tracking-[0.14em] text-muted-foreground",
								children: "Or paste notes"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								value: paste,
								onChange: (e) => setPaste(e.target.value),
								placeholder: "Paste lecture notes, a handbook chapter, or a course outline…",
								"aria-label": "Paste notes"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								className: "mt-3 w-full sm:w-auto",
								variant: "secondary",
								disabled: paste.trim().length < 80,
								onClick: () => void runFromText(paste, title || "Pasted notes", "paste"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-4" }), "Map pasted notes"]
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "w-full",
							onClick: () => void runSample(),
							children: "Use the sample CIT 102 course"
						})
					]
				})
			]
		})]
	});
}
//#endregion
export { NewCoursePage as component };
