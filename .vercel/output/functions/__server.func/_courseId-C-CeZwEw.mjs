import { o as __toESM } from "./_runtime.mjs";
import { u as require_react } from "./_libs/@floating-ui/react-dom+[...].mjs";
import { _ as Link, y as useNavigate } from "./_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "./_libs/radix-ui__react-context+react.mjs";
import { n as resolveCitation, r as splitCitationText, t as parseCitationTag } from "./_ssr/cite-match-JorDBpLw.mjs";
import { c as ListTree, d as ArrowUp, i as Trash2, o as Play, s as Pause, t as X, u as Check } from "./_libs/lucide-react.mjs";
import { r as useQueryClient, t as useQuery } from "./_libs/tanstack__react-query.mjs";
import { n as toast } from "./_libs/sonner.mjs";
import { r as Route$2 } from "./_ssr/router-CivmaWDa.mjs";
import { i as useCurrentUserState, n as cn, t as Button } from "./_ssr/button-CcZhciIu.mjs";
import { a as completeQuiz, c as deleteCourse, d as listenToTopic, g as tutorChat, h as submitAnswer, i as StateBlock, l as getWorkspace, m as startQuiz, n as RedirectToSignIn, p as selectTopic, r as Skeleton, t as AppHeader } from "./_ssr/state-block-Dz-W-6Yz.mjs";
import { n as Progress, t as Badge } from "./_ssr/progress-BnGHJQ8F.mjs";
import { i as Trigger, n as Portal, r as Root2, t as Content2 } from "./_libs/@radix-ui/react-popover+[...].mjs";
import { t as Markdown } from "./_libs/react-markdown+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_courseId-C-CeZwEw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CourseTree({ chapters, activeTopicId, onSelect }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		"aria-label": "Course",
		className: "space-y-5",
		children: chapters.map((ch) => {
			const done = ch.topics.length > 0 && ch.topics.every((t) => (t.mastery ?? 0) >= 75);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex items-start gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground",
				children: [done ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "mt-0.5 size-3.5 shrink-0 text-ok" }) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "min-w-0 text-pretty",
					children: ch.title
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-2 space-y-0.5",
				children: ch.topics.map((t) => {
					const active = t.id === activeTopicId;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => onSelect(t.id),
						"aria-current": active ? "page" : void 0,
						title: t.title,
						className: cn("flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "min-w-0 flex-1 truncate",
							children: t.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "shrink-0 tabular-nums text-xs text-muted-foreground",
							children: t.mastery == null ? "—" : `${t.mastery}%`
						})]
					}) }, t.id);
				})
			})] }, ch.id);
		})
	});
}
function CitationChip({ tag, citation }) {
	const parsed = parseCitationTag(tag);
	const title = citation?.sourceName || parsed.title;
	const page = citation?.page ?? parsed.page;
	const heading = citation?.heading;
	const excerpt = citation?.excerpt?.trim() ?? "";
	const label = citation?.label ?? tag;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Root2, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			"data-citation": true,
			"aria-label": `Open source ${label}`,
			className: "mx-0.5 inline rounded-sm bg-secondary px-1.5 py-0.5 align-baseline text-xs font-medium text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
			children: label
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Content2, {
		side: "top",
		align: "start",
		sideOffset: 8,
		collisionPadding: 12,
		className: "z-50 w-80 max-w-[calc(100vw-2rem)] rounded-lg bg-popover p-4 text-popover-foreground shadow-[var(--shadow-border)] outline-none",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-xs uppercase tracking-[0.14em] text-muted-foreground",
			children: [title, page != null ? ` · p. ${page}` : heading ? ` · ${heading}` : ""]
		}), excerpt ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 max-h-48 overflow-y-auto text-pretty text-sm leading-relaxed",
			children: excerpt
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm text-muted-foreground",
			children: "No retrieved excerpt is attached to this citation."
		})]
	}) })] });
}
function withCitations(node, citations) {
	if (node == null || typeof node === "boolean") return node;
	if (typeof node === "string" || typeof node === "number") {
		const text = String(node);
		const parts = splitCitationText(text);
		if (parts.length === 1 && parts[0].type === "text") return text;
		return parts.map((part, i) => part.type === "cite" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CitationChip, {
			tag: part.value,
			citation: resolveCitation(part.value, citations)
		}, `c-${i}`) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: part.value }, `t-${i}`));
	}
	if (Array.isArray(node)) return import_react.Children.map(node, (child) => withCitations(child, citations));
	if ((0, import_react.isValidElement)(node) && node.props.children != null) return (0, import_react.cloneElement)(node, void 0, withCitations(node.props.children, citations));
	return node;
}
function MessageContent({ content, citations = [], className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("space-y-3 break-words text-pretty [overflow-wrap:anywhere]", className),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Markdown, {
			components: {
				p: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: withCitations(children, citations) }),
				li: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "text-pretty",
					children: withCitations(children, citations)
				}),
				strong: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
					className: "font-medium text-foreground",
					children
				}),
				em: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children }),
				ul: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "list-disc space-y-1 pl-5",
					children
				}),
				ol: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "list-decimal space-y-1 pl-5",
					children
				}),
				h1: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-serif text-lg tracking-tight",
					children
				}),
				h2: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-serif text-base tracking-tight",
					children
				}),
				h3: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
					className: "font-serif text-base tracking-tight",
					children
				}),
				a: ({ href, children }) => href?.startsWith("http") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href,
					className: "underline underline-offset-2",
					rel: "noreferrer",
					children
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children })
			},
			children: content
		})
	});
}
function ListenPane({ courseId, topic }) {
	const [transcript, setTranscript] = (0, import_react.useState)(null);
	const [citations, setCitations] = (0, import_react.useState)([]);
	const [error, setError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [src, setSrc] = (0, import_react.useState)(null);
	const [playing, setPlaying] = (0, import_react.useState)(false);
	const audioRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		return () => {
			if (src) URL.revokeObjectURL(src);
		};
	}, [src]);
	(0, import_react.useEffect)(() => {
		setTranscript(null);
		setCitations([]);
		setError(null);
		setPlaying(false);
		if (src) URL.revokeObjectURL(src);
		setSrc(null);
	}, [topic?.id]);
	async function generate() {
		if (!topic) return;
		setBusy(true);
		setError(null);
		try {
			const result = await listenToTopic({ data: {
				courseId,
				topicId: topic.id
			} });
			setTranscript(result.transcript);
			setCitations(result.citations ?? []);
			if (result.audioBase64) {
				const bytes = Uint8Array.from(atob(result.audioBase64), (c) => c.charCodeAt(0));
				const blob = new Blob([bytes], { type: result.mime || "audio/mpeg" });
				const url = URL.createObjectURL(blob);
				if (src) URL.revokeObjectURL(src);
				setSrc(url);
			} else if (result.error) setError("Audio is unavailable, so here is the spoken script instead.");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not build a lesson");
		} finally {
			setBusy(false);
		}
	}
	function toggle() {
		const el = audioRef.current;
		if (!el) return;
		if (el.paused) {
			el.play();
			setPlaying(true);
		} else {
			el.pause();
			setPlaying(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-xl py-6 pb-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs uppercase tracking-[0.16em] text-muted-foreground",
				children: "Listen"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-2 font-serif text-3xl tracking-tight text-balance",
				children: topic?.title ?? "Pick a topic"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-pretty text-sm text-muted-foreground",
				children: "A short spoken pass through the source — useful when you are commuting or tired of screens."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "w-full sm:w-auto",
					onClick: () => void generate(),
					disabled: !topic || busy,
					children: busy ? "Preparing…" : "Build audio lesson"
				}), src ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					className: "w-full sm:w-auto",
					variant: "secondary",
					onClick: toggle,
					children: [playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" }), playing ? "Pause" : "Play"]
				}) : null]
			}),
			src ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("audio", {
				ref: audioRef,
				src,
				className: "mt-4 w-full accent-primary",
				controls: true,
				onPlay: () => setPlaying(true),
				onPause: () => setPlaying(false)
			}) : null,
			busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 space-y-2",
				"aria-busy": "true",
				"aria-label": "Preparing transcript",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-full" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-11/12" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-4/5" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-2/3" })
				]
			}) : null,
			error && !transcript ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StateBlock, {
					tone: "danger",
					title: "Could not build this lesson",
					body: error
				})
			}) : null,
			error && transcript ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-sm text-muted-foreground",
				role: "status",
				children: error
			}) : null,
			transcript ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageContent, {
				content: transcript,
				citations,
				className: "mt-6 text-sm leading-relaxed text-muted-foreground"
			}) : !busy && topic ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-pretty text-sm text-muted-foreground",
				children: topic.summary
			}) : null
		]
	});
}
function QuizSkeleton({ label = "Writing questions from the source…" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-xl py-4",
		"aria-busy": "true",
		"aria-live": "polite",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs uppercase tracking-[0.16em] text-muted-foreground",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-3 h-1.5 w-full rounded-full" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-6 w-28 rounded-full" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-6 w-16 rounded-full" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-4 h-16 w-full" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-12 w-full rounded-lg" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-12 w-full rounded-lg" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-12 w-full rounded-lg" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-12 w-full rounded-lg" })
				]
			})
		]
	});
}
function QuizPane({ quiz, revealEach, onAnswer, onFinish, onRetry }) {
	const [index, setIndex] = (0, import_react.useState)(0);
	const [local, setLocal] = (0, import_react.useState)(quiz);
	const [pending, setPending] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setLocal(quiz);
		if (quiz.status === "active") setIndex(0);
	}, [quiz]);
	const q = local.questions[index];
	const answeredCount = local.questions.filter((item) => item.selectedIndex != null).length;
	const done = local.status === "complete";
	if (!q) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "p-6 text-sm text-muted-foreground",
		children: "No questions in this set."
	});
	if (done) {
		const right = local.questions.filter((item) => item.isCorrect).length;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-xl py-6 pb-10",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs uppercase tracking-[0.16em] text-muted-foreground",
					children: local.kind === "exam" ? "Practice exam" : "Practice"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "mt-2 font-serif text-3xl tracking-tight",
					children: [
						local.score ?? 0,
						"% · ",
						right,
						"/",
						local.questions.length
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
					value: local.score ?? 0,
					className: "mt-4",
					"aria-label": "Score"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-6 space-y-3",
					children: local.questions.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-lg bg-card p-4 shadow-[var(--shadow-border)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "truncate text-xs text-muted-foreground",
								children: [
									i + 1,
									". ",
									item.topicTitle
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-pretty break-words text-sm",
								children: item.stem
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: cn("mt-2 text-pretty break-words text-sm", item.isCorrect ? "text-ok" : "text-destructive"),
								children: [
									item.isCorrect ? "Correct" : "Missed",
									" — ",
									item.explanation
								]
							})
						]
					}, item.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-col-reverse gap-3 sm:flex-row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "w-full sm:w-auto",
						variant: "secondary",
						onClick: onRetry,
						children: "Try another set"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "w-full sm:w-auto",
						onClick: onFinish,
						children: "Back to study"
					})]
				})
			]
		});
	}
	const revealed = q.selectedIndex != null && (revealEach || false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex max-w-xl flex-col py-4 pb-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3 text-xs text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "uppercase tracking-[0.16em]",
					children: local.kind === "exam" ? "Practice exam" : local.kind === "check" ? "Check" : "Practice"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "tabular-nums",
					children: [
						index + 1,
						" / ",
						local.questions.length
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
				value: answeredCount / local.questions.length * 100,
				className: "mt-3",
				"aria-label": "Questions answered"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex min-w-0 flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						className: "max-w-full truncate",
						children: q.topicTitle
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "default",
						children: q.difficulty
					}),
					q.sourcePage != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, { children: ["p.", q.sourcePage] }) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-4 font-serif text-2xl tracking-tight text-pretty break-words",
				children: q.stem
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				role: "radiogroup",
				"aria-label": "Answer choices",
				className: "mt-5 space-y-2",
				children: q.choices.map((choice, i) => {
					const selected = q.selectedIndex === i;
					const isAnswer = revealed && q.correctIndex === i;
					const isWrong = revealed && selected && !q.isCorrect;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						role: "radio",
						"aria-checked": selected,
						disabled: q.selectedIndex != null || pending,
						onKeyDown: (e) => {
							if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
							e.preventDefault();
							const next = (i + (e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1) + q.choices.length) % q.choices.length;
							(e.currentTarget.closest("[role='radiogroup']")?.querySelectorAll("[role='radio']")[next])?.focus();
						},
						onClick: async () => {
							setPending(true);
							try {
								const result = await onAnswer(q.id, i);
								setLocal((prev) => ({
									...prev,
									questions: prev.questions.map((item) => item.id === q.id ? {
										...item,
										selectedIndex: i,
										correctIndex: result.correctIndex,
										explanation: result.explanation,
										isCorrect: result.isCorrect
									} : item)
								}));
							} finally {
								setPending(false);
							}
						},
						className: cn("flex min-h-12 w-full items-start gap-3 rounded-lg px-4 py-3 text-left text-sm shadow-[var(--shadow-border)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", selected && !revealed && "bg-accent", isAnswer && "bg-ok/15 text-foreground", isWrong && "bg-destructive/15", q.selectedIndex == null && "hover:bg-accent"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-0.5 w-4 shrink-0 font-medium text-muted-foreground",
							children: String.fromCharCode(65 + i)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "min-w-0 flex-1 text-pretty break-words",
							children: choice
						})]
					}) }, `${q.id}-${i}`);
				})
			}),
			revealed && q.explanation ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-pretty break-words text-sm text-muted-foreground",
				children: q.explanation
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex flex-wrap justify-end gap-2",
				children: [index > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					onClick: () => setIndex((n) => n - 1),
					children: "Back"
				}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "min-w-28",
					disabled: q.selectedIndex == null,
					onClick: () => {
						if (index < local.questions.length - 1) setIndex((n) => n + 1);
						else onFinish();
					},
					children: index < local.questions.length - 1 ? "Next" : "See results"
				})]
			})
		]
	});
}
function ReadinessPane({ workspace, onExam, onPractice }) {
	const r = workspace.readiness;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-xl py-6 pb-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs uppercase tracking-[0.16em] text-muted-foreground",
				children: "Exam readiness"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-2 font-serif text-4xl tracking-tight",
				children: r.label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-pretty text-sm text-muted-foreground",
				children: [
					"Overall mastery among assessed topics is ",
					r.overall,
					"%. ",
					r.assessedPct,
					"% of the course has evidence; ",
					r.exploredPct,
					"% has study evidence from attempts or a mastery score."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
				value: r.overall,
				className: "mt-5",
				"aria-label": "Overall mastery"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 grid gap-4 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl bg-card p-5 shadow-[var(--shadow-border)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-xs uppercase tracking-[0.14em] text-muted-foreground",
						children: "Strong"
					}), r.strong.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted-foreground",
						children: "Nothing is solid yet. That is expected."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 space-y-1",
						children: r.strong.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex min-h-11 items-center justify-between gap-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "min-w-0 flex-1 truncate",
								title: t.title,
								children: t.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
								variant: "ok",
								className: "shrink-0",
								children: [t.mastery, "%"]
							})]
						}, t.id))
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl bg-card p-5 shadow-[var(--shadow-border)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-xs uppercase tracking-[0.14em] text-muted-foreground",
						children: "Needs attention"
					}), r.needsAttention.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted-foreground",
						children: "No weak topics on record."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 space-y-1",
						children: r.needsAttention.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center justify-between gap-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "min-h-11 min-w-0 flex-1 truncate rounded-md px-1 text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
								title: t.title,
								onClick: () => onPractice(t.id),
								children: t.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: t.mastery == null ? "default" : "warn",
								className: "shrink-0",
								children: t.mastery == null ? "unassessed" : `${t.mastery}%`
							})]
						}, t.id))
					})]
				})]
			}),
			r.weakest ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-6 text-pretty text-sm",
				children: ["Most important weakness: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-medium",
					children: r.weakest.title
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "w-full sm:w-auto",
					onClick: onExam,
					children: "Start practice exam"
				}), r.weakest ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "w-full sm:w-auto",
					variant: "secondary",
					onClick: () => onPractice(r.weakest.id),
					children: "Targeted practice"
				}) : null]
			})
		]
	});
}
function TutorPane({ workspace, topicTitle, busy, error, onSend, onAction }) {
	const [draft, setDraft] = (0, import_react.useState)("");
	const endRef = (0, import_react.useRef)(null);
	const listRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		endRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "end"
		});
	}, [workspace.messages.length, busy]);
	const rec = workspace.recommendation;
	const showRec = workspace.messages.length <= 2;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 flex-col",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			ref: listRef,
			className: "min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-1 py-4",
			children: [
				showRec ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl bg-card p-5 shadow-[var(--shadow-border)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs uppercase tracking-[0.16em] text-muted-foreground",
							children: "Welcome back"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-2 font-serif text-2xl tracking-tight",
							children: rec.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-pretty text-sm text-muted-foreground",
							children: rec.body
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "mt-4",
							onClick: () => onAction(rec),
							children: rec.cta
						})
					]
				}) : null,
				workspace.messages.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: m.role === "user" ? "ml-4 rounded-lg bg-secondary px-4 py-3 text-sm sm:ml-8" : "mr-2 text-sm leading-relaxed text-foreground sm:mr-4",
					children: [m.role === "assistant" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mb-1 truncate text-xs uppercase tracking-[0.14em] text-muted-foreground",
						children: ["Study tutor", topicTitle ? ` · ${topicTitle}` : ""]
					}) : null, m.role === "assistant" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageContent, {
						content: m.content,
						citations: m.citations
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "whitespace-pre-wrap break-words text-pretty",
						children: m.content
					})]
				}, m.id)),
				busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					"aria-live": "polite",
					"aria-label": "Tutor is writing",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-3 w-24" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-full" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-4/5" })
					]
				}) : null,
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-destructive",
					role: "alert",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: endRef })
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", {
			className: "border-t border-border bg-background py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
			"aria-label": "Send a message to the tutor",
			onSubmit: (e) => {
				e.preventDefault();
				const text = draft.trim();
				if (!text || busy) return;
				setDraft("");
				onSend(text);
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: draft,
					onChange: (e) => setDraft(e.target.value),
					placeholder: "Ask anything about this course…",
					"aria-label": "Message the tutor",
					autoComplete: "off",
					className: "h-12 min-w-0 flex-1 rounded-lg bg-secondary px-4 text-sm shadow-[var(--shadow-border)] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					size: "icon",
					disabled: busy || !draft.trim(),
					"aria-label": "Send",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, { className: "size-4" })
				})]
			})
		})]
	});
}
function CoursePage() {
	const { user, isPending } = useCurrentUserState();
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorkspaceSkeleton, {});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CourseWorkspaceView, {});
}
function WorkspaceSkeleton() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-dvh flex-col overflow-hidden",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, { compact: true }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-b border-border px-4 py-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-7 w-40" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-3 h-1.5 max-w-xs rounded-full" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-11 w-20 rounded-full" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-11 w-24 rounded-full" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-11 w-16 rounded-full" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-11 w-20 rounded-full" })
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-h-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "hidden w-72 shrink-0 border-r border-border p-4 lg:block",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-3 w-32" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-3 h-11 w-full rounded-md" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-1 h-11 w-full rounded-md" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-1 h-11 w-full rounded-md" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-6 h-3 w-28" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-3 h-11 w-full rounded-md" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-1 h-11 w-full rounded-md" })
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1 p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-36 w-full max-w-2xl rounded-xl" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-4 h-16 w-2/3 max-w-2xl" })]
				})]
			})
		]
	});
}
function CourseWorkspaceView() {
	const { courseId } = Route$2.useParams();
	const search = Route$2.useSearch();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const id = Number(courseId);
	const [treeOpen, setTreeOpen] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [tutorError, setTutorError] = (0, import_react.useState)(null);
	const [quiz, setQuiz] = (0, import_react.useState)(null);
	const [quizError, setQuizError] = (0, import_react.useState)(null);
	const [startingQuiz, setStartingQuiz] = (0, import_react.useState)(false);
	const query = useQuery({
		queryKey: ["workspace", id],
		queryFn: () => getWorkspace({ data: { courseId: id } }),
		enabled: Number.isFinite(id)
	});
	const workspace = query.data ?? null;
	const topics = (0, import_react.useMemo)(() => workspace?.chapters.flatMap((ch) => ch.topics) ?? [], [workspace]);
	const activeTopicId = search.topic ?? workspace?.course.lastTopicId ?? topics[0]?.id ?? null;
	const activeTopic = topics.find((t) => t.id === activeTopicId) ?? null;
	function setMode(mode, topic) {
		navigate({
			to: "/courses/$courseId",
			params: { courseId },
			search: {
				mode,
				topic: topic ?? activeTopicId ?? void 0
			}
		});
	}
	async function onSelectTopic(topicId) {
		setTreeOpen(false);
		setMode(search.mode, topicId);
		try {
			const next = await selectTopic({ data: {
				courseId: id,
				topicId
			} });
			queryClient.setQueryData(["workspace", id], next);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not open topic");
		}
	}
	async function launchQuiz(kind, topicIds, count) {
		setStartingQuiz(true);
		setQuizError(null);
		try {
			const view = await startQuiz({ data: {
				courseId: id,
				kind,
				topicIds,
				count
			} });
			setQuiz(view);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Could not start questions";
			setQuizError(message);
			toast.error(message);
		} finally {
			setStartingQuiz(false);
		}
	}
	async function onSend(message) {
		setBusy(true);
		setTutorError(null);
		try {
			const result = await tutorChat({ data: {
				courseId: id,
				topicId: activeTopicId,
				message
			} });
			queryClient.setQueryData(["workspace", id], result.workspace);
			if (result.action) {
				if (result.action.kind === "exam") setMode("exam");
				else {
					setMode("practice", result.action.topicId);
					await launchQuiz("practice", result.action.topicId ? [result.action.topicId] : void 0, result.action.count);
				}
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : "The tutor could not reply";
			setTutorError(message);
			toast.error(message);
		} finally {
			setBusy(false);
		}
	}
	async function onAction(action) {
		if (action.kind === "exam") {
			setMode("exam", action.topicId);
			await launchQuiz("exam", void 0, action.count);
			return;
		}
		if (action.kind === "practice" || action.kind === "check") {
			setMode("practice", action.topicId);
			await launchQuiz(action.kind, action.topicId ? [action.topicId] : void 0, action.count);
			return;
		}
		if (action.topicId) await onSelectTopic(action.topicId);
		setMode("study", action.topicId);
	}
	async function finishQuiz() {
		if (!quiz) return;
		try {
			const view = await completeQuiz({ data: { sessionId: quiz.sessionId } });
			setQuiz(view);
			await query.refetch();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not finish the set");
		}
	}
	if (query.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorkspaceSkeleton, {});
	if (query.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-dvh flex-col",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, { compact: true }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "mx-auto w-full max-w-lg px-4 py-16",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StateBlock, {
				tone: "danger",
				title: "Could not load this course",
				body: query.error instanceof Error ? query.error.message : "Something went wrong while opening the workspace.",
				action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => void query.refetch(),
					children: "Try again"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					variant: "secondary",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						children: "My courses"
					})
				})] })
			})
		})]
	});
	if (!workspace) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-dvh flex-col",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, { compact: true }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "mx-auto w-full max-w-lg px-4 py-16",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StateBlock, {
				title: "Course not found",
				body: "It may have been removed, or the link is no longer valid.",
				action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						children: "My courses"
					})
				})
			})
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-dvh flex-col overflow-hidden",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, {
				compact: true,
				trailing: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "inline-flex size-11 items-center justify-center text-sm text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
					onClick: async () => {
						if (!window.confirm("Remove this course and its study history?")) return;
						await deleteCourse({ data: { courseId: id } });
						await queryClient.invalidateQueries({ queryKey: ["courses"] });
						await navigate({ to: "/" });
					},
					"aria-label": "Delete course",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-b border-border",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "inline-flex h-11 shrink-0 items-center gap-2 rounded-md px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden",
						onClick: () => setTreeOpen(true),
						"aria-expanded": treeOpen,
						"aria-controls": "course-map-drawer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListTree, { className: "size-4" }), "Course"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex min-w-0 items-baseline gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "shrink-0 font-serif text-xl tracking-tight sm:text-2xl",
								children: workspace.course.code
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "min-w-0 truncate text-sm text-muted-foreground",
								children: workspace.course.title
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
									value: workspace.readiness.exploredPct,
									className: "min-w-0 max-w-xs flex-1",
									"aria-label": "Course explored"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs tabular-nums text-muted-foreground",
									children: [workspace.readiness.exploredPct, "% explored"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: workspace.readiness.label === "Exam ready" ? "ok" : "default",
									children: workspace.readiness.label
								})
							]
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					role: "tablist",
					"aria-label": "Study mode",
					className: "flex gap-1 overflow-x-auto px-4 pb-3",
					children: [
						{
							id: "study",
							label: "Study"
						},
						{
							id: "practice",
							label: "Practice"
						},
						{
							id: "exam",
							label: "Exam"
						},
						{
							id: "listen",
							label: "Listen"
						}
					].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						role: "tab",
						"aria-selected": search.mode === m.id,
						onClick: () => {
							if (m.id !== search.mode) {
								setQuiz(null);
								setQuizError(null);
							}
							setMode(m.id);
						},
						className: cn("h-11 shrink-0 rounded-full px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", search.mode === m.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"),
						children: m.label
					}, m.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-h-0 flex-1 overflow-hidden",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
						className: "hidden w-72 shrink-0 overflow-y-auto overscroll-contain border-r border-border p-4 lg:block",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CourseTree, {
							chapters: workspace.chapters,
							activeTopicId,
							onSelect: (tid) => void onSelectTopic(tid)
						})
					}),
					treeOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						id: "course-map-drawer",
						className: "fixed inset-0 z-40 lg:hidden",
						role: "dialog",
						"aria-modal": "true",
						"aria-label": "Course map",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "absolute inset-0 bg-ink/70",
							"aria-label": "Close course map",
							onClick: () => setTreeOpen(false)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "absolute inset-y-0 left-0 w-[min(20rem,88vw)] overflow-y-auto overscroll-contain bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-border)]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-4 flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-serif text-lg",
									children: "Course"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "grid size-11 place-items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
									onClick: () => setTreeOpen(false),
									"aria-label": "Close course map",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CourseTree, {
								chapters: workspace.chapters,
								activeTopicId,
								onSelect: (tid) => void onSelectTopic(tid)
							})]
						})]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
						className: cn("min-h-0 min-w-0 flex-1 px-4 lg:px-8", search.mode === "study" ? "overflow-hidden" : "overflow-y-auto overscroll-contain"),
						children: [
							search.mode === "study" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mx-auto flex h-full max-w-2xl flex-col",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TutorPane, {
									workspace,
									topicTitle: activeTopic?.title ?? null,
									busy,
									error: tutorError,
									onSend: (m) => void onSend(m),
									onAction: (a) => void onAction(a)
								})
							}) : null,
							search.mode === "practice" ? startingQuiz ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuizSkeleton, {}) : quiz ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuizPane, {
								quiz,
								revealEach: true,
								onAnswer: (questionId, selectedIndex) => submitAnswer({ data: {
									questionId,
									selectedIndex
								} }),
								onFinish: () => {
									if (quiz.status === "complete") {
										setQuiz(null);
										setMode("study");
									} else finishQuiz();
								},
								onRetry: () => void launchQuiz("practice", activeTopicId ? [activeTopicId] : void 0, 5)
							}, `${quiz.sessionId}-${quiz.status}`) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mx-auto max-w-xl py-16",
								children: quizError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StateBlock, {
									tone: "danger",
									title: "Could not start practice",
									body: quizError,
									action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										onClick: () => void launchQuiz("practice", activeTopicId ? [activeTopicId] : void 0, 5),
										children: "Try again"
									})
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "font-serif text-2xl",
										children: "Practice"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-2 text-pretty text-sm text-muted-foreground",
										children: [
											"A short set grounded in ",
											activeTopic?.title ?? "the current topic",
											"."
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										className: "mt-6",
										onClick: () => void launchQuiz("practice", activeTopicId ? [activeTopicId] : void 0, 5),
										children: "Start 5-question set"
									})
								] })
							}) : null,
							search.mode === "exam" ? startingQuiz ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuizSkeleton, { label: "Assembling a diagnostic from the source…" }) : quiz ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuizPane, {
								quiz,
								revealEach: false,
								onAnswer: (questionId, selectedIndex) => submitAnswer({ data: {
									questionId,
									selectedIndex
								} }),
								onFinish: () => {
									if (quiz.status === "complete") {
										setQuiz(null);
										setMode("exam");
									} else finishQuiz();
								},
								onRetry: () => void launchQuiz("exam", void 0, 12)
							}, `${quiz.sessionId}-${quiz.status}`) : quizError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mx-auto max-w-xl py-16",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StateBlock, {
									tone: "danger",
									title: "Could not start the exam",
									body: quizError,
									action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										onClick: () => void launchQuiz("exam", void 0, 12),
										children: "Try again"
									})
								})
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReadinessPane, {
								workspace,
								onExam: () => void launchQuiz("exam", void 0, 12),
								onPractice: (topicId) => {
									setMode("practice", topicId);
									launchQuiz("practice", [topicId], 8);
								}
							}) : null,
							search.mode === "listen" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListenPane, {
								courseId: id,
								topic: activeTopic
							}) : null
						]
					})
				]
			})
		]
	});
}
//#endregion
export { CoursePage as component };
