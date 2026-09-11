import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _ as Link, v as Navigate, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import "./server-BeBv8MlV.mjs";
import { t as authClient } from "./client-BzrKyXF3.mjs";
import { i as useCurrentUserState, t as Button } from "./button-CcZhciIu.mjs";
import { t as Input } from "./input-DBWL437_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-1Cyohv34.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Login() {
	const { user, isPending } = useCurrentUserState();
	const navigate = useNavigate();
	const [mode, setMode] = (0, import_react.useState)("in");
	const [name, setName] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	if (!isPending && user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	async function onEmail(e) {
		e.preventDefault();
		setError(null);
		setBusy(true);
		try {
			if (mode === "up") {
				const res = await authClient.signUp.email({
					email,
					password,
					name: name || email.split("@")[0]
				});
				if (res.error) throw new Error(res.error.message || "Could not create account");
			} else {
				const res = await authClient.signIn.email({
					email,
					password
				});
				if (res.error) throw new Error(res.error.message || "Could not sign in");
			}
			await navigate({ to: "/" });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Something went wrong");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-12 pb-[max(3rem,env(safe-area-inset-bottom))]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "font-serif text-2xl font-medium tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				children: "ApexStudy"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-8 font-serif text-3xl leading-tight tracking-tight",
				children: "Give me your course."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-pretty text-sm text-muted-foreground",
				children: "Sign in to map a course, study it, and keep a learner model that actually remembers you."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 space-y-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Sign-in is disabled."
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "my-6 flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-muted-foreground",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-border" }),
					"or email",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-border" })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: onEmail,
				className: "space-y-3",
				children: [
					mode === "up" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "Your name",
						value: name,
						onChange: (e) => setName(e.target.value),
						autoComplete: "name",
						"aria-label": "Your name"
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "email",
						required: true,
						placeholder: "Email",
						value: email,
						onChange: (e) => setEmail(e.target.value),
						autoComplete: "email",
						"aria-label": "Email"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "password",
						required: true,
						minLength: 8,
						placeholder: "Password",
						value: password,
						onChange: (e) => setPassword(e.target.value),
						autoComplete: mode === "up" ? "new-password" : "current-password",
						"aria-label": "Password"
					}),
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-destructive",
						role: "alert",
						children: error
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						className: "w-full",
						disabled: busy,
						children: busy ? "Working…" : mode === "up" ? "Create account" : "Sign in with email"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "mt-4 inline-flex min-h-11 items-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				onClick: () => setMode(mode === "up" ? "in" : "up"),
				children: mode === "up" ? "Already have an account? Sign in" : "New here? Create an account"
			})
		]
	});
}
//#endregion
export { Login as component };
