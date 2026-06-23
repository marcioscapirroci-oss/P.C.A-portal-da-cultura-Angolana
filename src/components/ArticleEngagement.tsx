import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, Bookmark, MessageCircle, Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Comment = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  author?: string | null;
};

export function ArticleEngagement({ articleId }: { articleId: string }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [favored, setFavored] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      setUserId(user?.id ?? null);

      const [{ count }, likedRes, favRes, commentsRes] = await Promise.all([
        supabase.from("article_likes").select("*", { count: "exact", head: true }).eq("article_id", articleId),
        user ? supabase.from("article_likes").select("user_id").eq("article_id", articleId).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
        user ? supabase.from("favorites").select("user_id").eq("article_id", articleId).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from("comments").select("id, user_id, body, created_at").eq("article_id", articleId).eq("approved", true).order("created_at", { ascending: false }).limit(50),
      ]);
      if (!active) return;
      setLikes(count ?? 0);
      setLiked(!!likedRes.data);
      setFavored(!!favRes.data);
      const items = (commentsRes.data ?? []) as Comment[];
      if (items.length) {
        const ids = Array.from(new Set(items.map((c) => c.user_id)));
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        const map = new Map((profs ?? []).map((p) => [p.id, p.full_name]));
        setComments(items.map((c) => ({ ...c, author: map.get(c.user_id) ?? "Leitor" })));
      } else {
        setComments([]);
      }
    })();
    return () => { active = false; };
  }, [articleId]);

  async function toggleLike() {
    if (!userId) return toast.info("Inicie sessão para reagir");
    if (liked) {
      const { error } = await supabase.from("article_likes").delete().eq("article_id", articleId).eq("user_id", userId);
      if (!error) { setLiked(false); setLikes((n) => Math.max(0, n - 1)); }
    } else {
      const { error } = await supabase.from("article_likes").insert({ article_id: articleId, user_id: userId });
      if (!error) { setLiked(true); setLikes((n) => n + 1); }
    }
  }

  async function toggleFav() {
    if (!userId) return toast.info("Inicie sessão para guardar nos favoritos");
    if (favored) {
      const { error } = await supabase.from("favorites").delete().eq("article_id", articleId).eq("user_id", userId);
      if (!error) { setFavored(false); toast.success("Removido dos favoritos"); }
    } else {
      const { error } = await supabase.from("favorites").insert({ article_id: articleId, user_id: userId });
      if (!error) { setFavored(true); toast.success("Guardado nos favoritos"); }
    }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return toast.info("Inicie sessão para comentar");
    if (newComment.trim().length < 2) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("comments")
      .insert({ article_id: articleId, user_id: userId, body: newComment.trim() })
      .select("id, user_id, body, created_at")
      .single();
    setBusy(false);
    if (error) return toast.error(error.message);
    const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle();
    setComments((prev) => [{ ...(data as Comment), author: prof?.full_name ?? "Leitor" }, ...prev]);
    setNewComment("");
  }

  return (
    <section className="mt-12 border-t border-border/60 pt-8">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={toggleLike}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${liked ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} /> {likes} {likes === 1 ? "gosto" : "gostos"}
        </button>
        <button
          onClick={toggleFav}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${favored ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
        >
          <Bookmark className={`h-4 w-4 ${favored ? "fill-current" : ""}`} /> {favored ? "Guardado" : "Guardar"}
        </button>
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <MessageCircle className="h-4 w-4" /> {comments.length} {comments.length === 1 ? "comentário" : "comentários"}
        </span>
      </div>

      <h2 className="mt-10 font-display text-2xl">Comentários</h2>

      {userId ? (
        <form onSubmit={submitComment} className="mt-4 flex flex-col gap-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            placeholder="Partilhe a sua opinião…"
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-gradient-gold px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Publicar
          </button>
        </form>
      ) : (
        <p className="mt-4 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          <Link to="/auth" className="text-primary underline-offset-4 hover:underline">Inicie sessão</Link> para comentar.
        </p>
      )}

      <ul className="mt-6 space-y-4">
        {comments.map((c) => (
          <li key={c.id} className="rounded-2xl border border-border/60 bg-card/60 px-4 py-3">
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{c.author}</span>
              <span>{new Date(c.created_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{c.body}</p>
          </li>
        ))}
        {comments.length === 0 && (
          <li className="text-sm text-muted-foreground">Seja o primeiro a comentar.</li>
        )}
      </ul>
    </section>
  );
}
