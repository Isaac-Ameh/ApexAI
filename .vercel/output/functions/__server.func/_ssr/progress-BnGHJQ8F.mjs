import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { n as cn } from "./button-CcZhciIu.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/progress-BnGHJQ8F.js
var import_jsx_runtime = require_jsx_runtime();
var badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums", {
	variants: { variant: {
		default: "bg-secondary text-muted-foreground",
		solid: "bg-primary text-primary-foreground",
		ok: "bg-ok/15 text-ok",
		warn: "bg-warn/15 text-warn",
		danger: "bg-destructive/15 text-destructive"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
function Progress({ value, className, "aria-label": ariaLabel }) {
	const pct = Math.max(0, Math.min(100, value));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("h-1.5 w-full overflow-hidden rounded-full bg-secondary", className),
		role: "progressbar",
		"aria-label": ariaLabel,
		"aria-valuenow": Math.round(pct),
		"aria-valuemin": 0,
		"aria-valuemax": 100,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "h-full rounded-full bg-primary transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
			style: { width: `${pct}%` }
		})
	});
}
//#endregion
export { Progress as n, Badge as t };
