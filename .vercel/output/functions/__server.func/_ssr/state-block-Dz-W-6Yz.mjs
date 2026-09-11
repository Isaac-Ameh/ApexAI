import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _ as Link, v as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { r as createServerFn } from "./ssr.mjs";
import { i as hasGateSessionMarker } from "./server-BeBv8MlV.mjs";
import { i as createSsrRpc } from "./router-CivmaWDa.mjs";
import "./client-BzrKyXF3.mjs";
import { i as useCurrentUserState, n as cn, r as useCurrentUser } from "./button-CcZhciIu.mjs";
import { t as authMiddleware } from "./middleware-BKMfHfWy.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/state-block-Dz-W-6Yz.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var subscribeToNothing = () => () => {};
var noGateSessionOnServer = () => false;
/**
* Auth state components — plain wrappers around `useCurrentUserState()`.
*
* With auth on, visitors are signed out until they authenticate — in the sandbox
* live preview too, which does real sign-in. The shared dev user appears only
* when auth is disabled (`VITE_AUTH_ENABLED=false`, the shipped default).
* While the session is still resolving, gates that care about signed-out state
* render nothing so there's no signed-out flash on hard reload.
*/
/** Where `RedirectToSignIn` sends signed-out visitors. Create this route. */
var SIGN_IN_PATH = "/login";
/**
* Client-side redirect to the sign-in route (TanStack `<Navigate>` — NOT a full
* `window.location` reload). A hard navigation re-bootstraps the SPA and re-runs
* session loading, which feels like a second "Loading…" on /login.
*
* Guard routes by waiting out `isPending` first (see `use-current-user`), then
* render this.
*/
function RedirectToSignIn({ to = SIGN_IN_PATH }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to });
}
/**
* Minimal signed-in identity chip + sign-out. Restyle freely (see the
* `design-ui` skill). Sign-out is only shown when auth is enabled (the
* disabled-auth dev user has nothing to sign out of) and the session is not
* gate-materialized — behind the gate the next request signs the viewer
* straight back in, so a sign-out control there is a broken loop.
*/
function UserButton() {
	const user = useCurrentUser();
	const [signingOut, setSigningOut] = (0, import_react.useState)(false);
	(0, import_react.useSyncExternalStore)(subscribeToNothing, hasGateSessionMarker, noGateSessionOnServer);
	if (!user) return null;
	const label = user.displayName ?? user.primaryEmail ?? "Account";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-w-0 items-center gap-2",
		children: [
			user.profileImageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: user.profileImageUrl,
				alt: "",
				className: "size-8 shrink-0 rounded-full object-cover"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-sm font-medium text-foreground shadow-[var(--shadow-border)]",
				"aria-hidden": "true",
				children: label.charAt(0).toUpperCase()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "hidden min-w-0 max-w-[9rem] truncate text-sm font-medium sm:inline",
				children: label
			}),
			false
		]
	});
}
function Skeleton({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("animate-pulse rounded-md bg-secondary", className) });
}
function AppHeader({ compact = false, trailing }) {
	const { user, isPending } = useCurrentUserState();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
		className: "sticky top-0 z-30 border-b border-border/80 bg-background/85 backdrop-blur-md",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4", compact && "max-w-none"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/",
				className: "flex min-w-0 items-baseline gap-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-serif text-xl font-medium tracking-tight",
					children: "ApexStudy"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "hidden truncate text-xs text-muted-foreground sm:inline",
					children: "Study, then prove it."
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 shrink-0 items-center gap-1 sm:gap-3",
				children: [trailing, isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-11 w-28 rounded-full" }) : user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/login",
					className: "inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
					children: "Sign in"
				})]
			})]
		})
	});
}
var listCourses = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("07ae34491a878c761a8b3ed377497cc24299b8148102be8dc365b0d7a7b8cc23"));
var getWorkspace = createServerFn({ method: "GET" }).validator((input) => input).middleware([authMiddleware]).handler(createSsrRpc("77af0e17b75b4b92616e5479ad855af61f4eb10305e186fc606141912c993a60"));
var createSampleCourse = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("0e89508b86671217ae9a1f1ca8de669f8e7d3f7b149952ac342324563bf4cf98"));
var createCourseFromText = createServerFn({ method: "POST" }).validator((input) => {
	const text = input.text.trim().slice(0, 1e5);
	if (text.length < 80) throw new Error("That document is too short to map into a course.");
	return {
		text,
		sourceName: input.sourceName.slice(0, 180) || "Uploaded material",
		kind: input.kind,
		code: input.code?.trim().slice(0, 32),
		title: input.title?.trim().slice(0, 120)
	};
}).middleware([authMiddleware]).handler(createSsrRpc("1b3dd904199232fb402b3d24fbaae51a4905fca041db051c2b7937018a584fa9"));
var renameCourse = createServerFn({ method: "POST" }).validator((input) => ({
	courseId: input.courseId,
	code: input.code.trim().slice(0, 32) || "COURSE",
	title: input.title.trim().slice(0, 120) || "Untitled course"
})).middleware([authMiddleware]).handler(createSsrRpc("6a77150ca36781b60415e9ce543fcec77213085679c90e2577919397ec619f85"));
var deleteCourse = createServerFn({ method: "POST" }).validator((input) => input).middleware([authMiddleware]).handler(createSsrRpc("58a5cb5d7668aa16117058e10c948d93959fd38dfe74e5fd57b1fae145b5cc40"));
var selectTopic = createServerFn({ method: "POST" }).validator((input) => input).middleware([authMiddleware]).handler(createSsrRpc("25244fe34f70adf84a0492918447940b0b2d40a7efd930b293bf5a29db5cec78"));
var tutorChat = createServerFn({ method: "POST" }).validator((input) => {
	const message = input.message.trim().slice(0, 4e3);
	if (!message) throw new Error("Type a question first.");
	return {
		courseId: input.courseId,
		topicId: input.topicId ?? null,
		message
	};
}).middleware([authMiddleware]).handler(createSsrRpc("84d44c7e25625845eb6d8aa067241ebf70a5412ffff73c6d2a38627ad5904916"));
var startQuiz = createServerFn({ method: "POST" }).validator((input) => ({
	courseId: input.courseId,
	kind: input.kind,
	topicIds: input.topicIds,
	count: Math.max(3, Math.min(20, input.count ?? (input.kind === "exam" ? 12 : 5)))
})).middleware([authMiddleware]).handler(createSsrRpc("fa6ace08640565c259618d41ec6f1967f3ee3c5a83b15413c38b1e4d765fa026"));
var submitAnswer = createServerFn({ method: "POST" }).validator((input) => input).middleware([authMiddleware]).handler(createSsrRpc("df726c9f0388c14f95204512341931905e7a70638d7728f1cefddb8e889cda8b"));
var completeQuiz = createServerFn({ method: "POST" }).validator((input) => input).middleware([authMiddleware]).handler(createSsrRpc("a4d56df08974866e3b2a2e21a5a102a2370f8af731d517d0e0c0acc59e638abc"));
var listenToTopic = createServerFn({ method: "POST" }).validator((input) => input).middleware([authMiddleware]).handler(createSsrRpc("892ed889d4a9df2aea5d286a7657bdee2b25f41db8c810eeaddf2c2c07610c5d"));
/** Shared empty / error card — matches the existing course empty state. */
function StateBlock({ kicker, title, body, action, tone = "default", className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("rounded-xl bg-card p-6 shadow-[var(--shadow-border)] sm:p-8", className),
		children: [
			kicker ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs uppercase tracking-[0.16em] text-muted-foreground",
				children: kicker
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: cn("font-serif text-2xl tracking-tight text-balance", kicker && "mt-2", tone === "danger" && "text-destructive"),
				children: title
			}),
			body ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-xl text-pretty text-sm text-muted-foreground",
				children: body
			}) : null,
			action ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 flex flex-wrap gap-3",
				children: action
			}) : null
		]
	});
}
//#endregion
export { completeQuiz as a, deleteCourse as c, listenToTopic as d, renameCourse as f, tutorChat as g, submitAnswer as h, StateBlock as i, getWorkspace as l, startQuiz as m, RedirectToSignIn as n, createCourseFromText as o, selectTopic as p, Skeleton as r, createSampleCourse as s, AppHeader as t, listCourses as u };
