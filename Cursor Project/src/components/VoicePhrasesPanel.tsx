import { VOICE_COMMAND_CATALOG } from "../domain/voice";

interface VoicePhrasesPanelProps {
  open: boolean;
  onClose: () => void;
}

export function VoicePhrasesPanel({ open, onClose }: VoicePhrasesPanelProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-phrases-title"
    >
      <div
        className="flex max-h-[min(85vh,720px)] w-[min(calc(100vw-2rem),560px)] flex-col rounded-xl border shadow-2xl"
        style={{
          borderColor: "var(--panel-border)",
          background: "var(--panel-bg-solid)",
        }}
      >
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "var(--panel-border)" }}
        >
          <div>
            <h2
              id="voice-phrases-title"
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Voice Commands
            </h2>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>
              Say the wake word, then one of these phrases
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost focus-ring px-2.5 py-1 text-xs"
          >
            Close
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto px-5 py-4">
          {VOICE_COMMAND_CATALOG.map((group) => (
            <section key={group.id} className="inset-block px-3 py-3">
              <p
                className="text-sm font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                {group.title}
              </p>
              <p
                className="mt-0.5 text-xs"
                style={{ color: "var(--text-faint)" }}
              >
                {group.description}
              </p>
              {group.examples.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {group.examples.map((example) => (
                    <li
                      key={example}
                      className="font-mono text-[11px]"
                      style={{ color: "var(--accent-strong)" }}
                    >
                      {example}
                    </li>
                  ))}
                </ul>
              ) : null}
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {group.phrases.map((phrase) => (
                  <li
                    key={phrase}
                    className="rounded border px-2 py-0.5 font-mono text-[11px]"
                    style={{
                      borderColor: "var(--panel-border)",
                      color: "var(--text-muted)",
                      background: "var(--inset-bg)",
                    }}
                  >
                    {phrase}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
