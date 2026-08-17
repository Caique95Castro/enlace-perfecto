
function MessageBoard({
  slug,
  messages,
}: {
  slug: string;
  messages: { id: string; author_name: string; message: string; photo_url: string | null }[];
}) {
  const [form, setForm] = useState({ name: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function send() {
    if (!form.name.trim() || !form.message.trim()) {
      toast.error("Preencha seu nome e a mensagem.");
      return;
    }
    setBusy(true);
    try {
      await submitGuestMessage({
        slug,
        authorName: form.name.trim(),
        message: form.message.trim(),
      });
      setSent(true);
      setForm({ name: "", message: "" });
      toast.success("Mensagem enviada! Ela aparece após a aprovação dos noivos.");
    } catch {
      toast.error("Não foi possível enviar sua mensagem.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-xl space-y-4 rounded-xl bg-white/80 p-6 backdrop-blur">
        {sent ? (
          <p className="text-center">Obrigado pelo carinho! Sua mensagem foi enviada aos noivos. 💌</p>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="msg-name">Seu nome</Label>
              <Input
                id="msg-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="msg-text">Deixe um recado</Label>
              <Textarea
                id="msg-text"
                rows={4}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              />
            </div>
            <Button className="w-full" onClick={send} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              Enviar mensagem
            </Button>
          </>
        )}
      </div>

      {messages.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {messages.map((m) => (
            <li key={m.id} className="rounded-xl bg-white/70 p-5">
              <div className="flex items-center gap-3">
                {m.photo_url ? (
                  <img
                    src={m.photo_url}
                    alt={`Foto enviada por ${m.author_name}`}
                    loading="lazy"
                    className="size-10 rounded-full object-cover"
                  />
                ) : null}
                <p className="font-medium">{m.author_name}</p>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm opacity-80">{m.message}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
