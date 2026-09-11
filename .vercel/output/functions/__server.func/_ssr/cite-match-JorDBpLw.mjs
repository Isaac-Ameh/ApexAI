//#region node_modules/.nitro/vite/services/ssr/assets/cite-match-JorDBpLw.js
var TAG_RE = /\[[^[\]]+\]/g;
function looksLikeCitation(tag) {
	return /\bsource\b/i.test(tag) || /p\.\s*\d+/i.test(tag) || /[—–]/.test(tag);
}
function parseCitationTag(tag) {
	const inner = tag.replace(/^\[/, "").replace(/\]$/, "").trim();
	const pageMatch = inner.match(/p\.\s*(\d+)/i);
	return {
		title: inner.replace(/\s*[—–-]\s*p\.\s*\d+\s*$/i, "").trim() || "Source",
		page: pageMatch ? Number(pageMatch[1]) : null
	};
}
function resolveCitation(tag, citations) {
	if (!citations.length) return null;
	const exact = citations.find((c) => c.label === tag);
	if (exact) return exact;
	const lower = tag.toLowerCase();
	const caseInsensitive = citations.find((c) => c.label.toLowerCase() === lower);
	if (caseInsensitive) return caseInsensitive;
	const parsed = parseCitationTag(tag);
	if (parsed.page != null) {
		const byPage = citations.find((c) => c.page === parsed.page);
		if (byPage) return byPage;
	}
	return citations.find((c) => c.locator && lower.includes(c.locator.toLowerCase())) ?? null;
}
function splitCitationText(text) {
	const parts = [];
	const re = new RegExp(TAG_RE.source, "g");
	let last = 0;
	let match;
	while (match = re.exec(text)) {
		if (match.index > last) parts.push({
			type: "text",
			value: text.slice(last, match.index)
		});
		const tag = match[0];
		parts.push({
			type: looksLikeCitation(tag) ? "cite" : "text",
			value: tag
		});
		last = match.index + tag.length;
	}
	if (last < text.length) parts.push({
		type: "text",
		value: text.slice(last)
	});
	return parts;
}
function toMessageCitations(raw) {
	if (raw == null || raw === "") return [];
	try {
		const v = typeof raw === "string" ? JSON.parse(raw) : raw;
		if (!Array.isArray(v)) return [];
		const out = [];
		for (const item of v) {
			if (!item || typeof item !== "object") continue;
			const c = item;
			const excerpt = typeof c.excerpt === "string" ? c.excerpt : "";
			const label = typeof c.label === "string" ? c.label : "";
			if (!excerpt && !label) continue;
			out.push({
				chunkId: typeof c.chunkId === "number" ? c.chunkId : Number(c.chunkId) || 0,
				sourceName: typeof c.sourceName === "string" ? c.sourceName : "Source",
				page: c.page == null || c.page === "" ? null : Number(c.page),
				heading: typeof c.heading === "string" ? c.heading : null,
				locator: typeof c.locator === "string" ? c.locator : "",
				label: label || "[Source]",
				excerpt
			});
		}
		return out;
	} catch {
		return [];
	}
}
//#endregion
export { toMessageCitations as i, resolveCitation as n, splitCitationText as r, parseCitationTag as t };
