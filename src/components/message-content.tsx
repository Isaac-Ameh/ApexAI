import * as Popover from "@radix-ui/react-popover";
import {
  Children,
  cloneElement,
  isValidElement,
  type ReactNode,
} from "react";
import Markdown from "react-markdown";
import {
  parseCitationTag,
  resolveCitation,
  splitCitationText,
} from "@/lib/apex/cite-match";
import type { MessageCitation } from "@/lib/apex/types";
import { cn } from "@/lib/utils";

function CitationChip({
  tag,
  citation,
}: {
  tag: string;
  citation: MessageCitation | null;
}) {
  const parsed = parseCitationTag(tag);
  const title = citation?.sourceName || parsed.title;
  const page = citation?.page ?? parsed.page;
  const heading = citation?.heading;
  const excerpt = citation?.excerpt?.trim() ?? "";
  const label = citation?.label ?? tag;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          data-citation
          aria-label={`Open source ${label}`}
          className="mx-0.5 inline rounded-sm bg-secondary px-1.5 py-0.5 align-baseline text-xs font-medium text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {label}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="start"
          sideOffset={8}
          collisionPadding={12}
          className="z-50 w-80 max-w-[calc(100vw-2rem)] rounded-lg bg-popover p-4 text-popover-foreground shadow-[var(--shadow-border)] outline-none"
        >
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {title}
            {page != null ? ` · p. ${page}` : heading ? ` · ${heading}` : ""}
          </p>
          {excerpt ? (
            <p className="mt-2 max-h-48 overflow-y-auto text-pretty text-sm leading-relaxed">
              {excerpt}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              No retrieved excerpt is attached to this citation.
            </p>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function withCitations(node: ReactNode, citations: MessageCitation[]): ReactNode {
  if (node == null || typeof node === "boolean") return node;
  if (typeof node === "string" || typeof node === "number") {
    const text = String(node);
    const parts = splitCitationText(text);
    if (parts.length === 1 && parts[0].type === "text") return text;
    return parts.map((part, i) =>
      part.type === "cite" ? (
        <CitationChip key={`c-${i}`} tag={part.value} citation={resolveCitation(part.value, citations)} />
      ) : (
        <span key={`t-${i}`}>{part.value}</span>
      ),
    );
  }
  if (Array.isArray(node)) {
    return Children.map(node, (child) => withCitations(child, citations));
  }
  if (isValidElement<{ children?: ReactNode }>(node) && node.props.children != null) {
    return cloneElement(node, undefined, withCitations(node.props.children, citations));
  }
  return node;
}

export function MessageContent({
  content,
  citations = [],
  className,
}: {
  content: string;
  citations?: MessageCitation[];
  className?: string;
}) {
  return (
    <div className={cn("space-y-3 break-words text-pretty [overflow-wrap:anywhere]", className)}>
      <Markdown
        components={{
          p: ({ children }) => <p>{withCitations(children, citations)}</p>,
          li: ({ children }) => (
            <li className="text-pretty">{withCitations(children, citations)}</li>
          ),
          strong: ({ children }) => <strong className="font-medium text-foreground">{children}</strong>,
          em: ({ children }) => <em>{children}</em>,
          ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
          h1: ({ children }) => (
            <h3 className="font-serif text-lg tracking-tight">{children}</h3>
          ),
          h2: ({ children }) => (
            <h3 className="font-serif text-base tracking-tight">{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="font-serif text-base tracking-tight">{children}</h4>
          ),
          a: ({ href, children }) =>
            href?.startsWith("http") ? (
              <a href={href} className="underline underline-offset-2" rel="noreferrer">
                {children}
              </a>
            ) : (
              <span>{children}</span>
            ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
