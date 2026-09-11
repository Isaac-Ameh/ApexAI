import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { MessageCitation, TopicRow } from "@/lib/apex/types";
import { listenToTopic } from "@/lib/apex/actions";
import { StateBlock } from "./state-block";
import { MessageContent } from "./message-content";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

export function ListenPane({
  courseId,
  topic,
}: {
  courseId: number;
  topic: TopicRow | null;
}) {
  const [transcript, setTranscript] = useState<string | null>(null);
  const [citations, setCitations] = useState<MessageCitation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (src) URL.revokeObjectURL(src);
    };
  }, [src]);

  useEffect(() => {
    setTranscript(null);
    setCitations([]);
    setError(null);
    setPlaying(false);
    if (src) URL.revokeObjectURL(src);
    setSrc(null);
    // Reset when the selected topic changes so a previous transcript doesn't linger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic?.id]);

  async function generate() {
    if (!topic) return;
    setBusy(true);
    setError(null);
    try {
      const result = await listenToTopic({ data: { courseId, topicId: topic.id } });
      setTranscript(result.transcript);
      setCitations(result.citations ?? []);
      if (result.audioBase64) {
        const bytes = Uint8Array.from(atob(result.audioBase64), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: result.mime || "audio/mpeg" });
        const url = URL.createObjectURL(blob);
        if (src) URL.revokeObjectURL(src);
        setSrc(url);
      } else if (result.error) {
        setError("Audio is unavailable, so here is the spoken script instead.");
      }
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
      void el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl py-6 pb-10">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Listen</p>
      <h2 className="mt-2 font-serif text-3xl tracking-tight text-balance">
        {topic?.title ?? "Pick a topic"}
      </h2>
      <p className="mt-2 text-pretty text-sm text-muted-foreground">
        A short spoken pass through the source — useful when you are commuting or tired of screens.
      </p>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap">
        <Button className="w-full sm:w-auto" onClick={() => void generate()} disabled={!topic || busy}>
          {busy ? "Preparing…" : "Build audio lesson"}
        </Button>
        {src ? (
          <Button className="w-full sm:w-auto" variant="secondary" onClick={toggle}>
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
            {playing ? "Pause" : "Play"}
          </Button>
        ) : null}
      </div>
      {src ? (
        <audio
          ref={audioRef}
          src={src}
          className="mt-4 w-full accent-primary"
          controls
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      ) : null}
      {busy ? (
        <div className="mt-6 space-y-2" aria-busy="true" aria-label="Preparing transcript">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : null}
      {error && !transcript ? (
        <div className="mt-6">
          <StateBlock tone="danger" title="Could not build this lesson" body={error} />
        </div>
      ) : null}
      {error && transcript ? (
        <p className="mt-4 text-sm text-muted-foreground" role="status">
          {error}
        </p>
      ) : null}
      {transcript ? (
        <MessageContent
          content={transcript}
          citations={citations}
          className="mt-6 text-sm leading-relaxed text-muted-foreground"
        />
      ) : !busy && topic ? (
        <p className="mt-6 text-pretty text-sm text-muted-foreground">{topic.summary}</p>
      ) : null}
    </div>
  );
}
