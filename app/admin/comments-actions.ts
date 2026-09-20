'use server';

import { revalidatePath } from 'next/cache';

import { fail, requireAdmin, succeed, toId, type ActionResult } from '@/lib/admin';
import { getAdminDict } from '@/lib/admin-locale';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * Hides a comment (instantly off the public site) or shows it again. Nothing
 * is lost either way: hiding only flips a flag, which is why it needs no
 * confirmation while deleting does.
 */
export async function setCommentHidden(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  requireAdmin();

  const t = getAdminDict();
  const id = toId(formData.get('id'));
  if (id === null) return fail(t.actions.commentNotIdentified);
  const hide = formData.get('hidden') === 'true';

  const { data, error } = await getSupabaseAdmin()
    .from('dish_comments')
    .update({ is_hidden: hide, hidden_at: hide ? new Date().toISOString() : null })
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('[admin] comment update failed with code', error.code);
    return fail(t.actions.commentUpdateFailed);
  }
  if (!data) return fail(t.actions.commentNotIdentified);

  revalidatePath('/admin', 'layout');
  return succeed(hide ? t.actions.commentHidden : t.actions.commentRestored, id);
}

/**
 * Permanently deletes one comment. Staff-only, irreversible (the UI confirms
 * first) and only ever for a comment that is already hidden — enforced here,
 * in the query itself, not just by the button being absent.
 */
export async function deleteComment(id: number): Promise<ActionResult> {
  requireAdmin();

  const t = getAdminDict();
  const commentId = toId(id);
  if (commentId === null) return fail(t.actions.commentNotIdentified);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('dish_comments').delete().eq('id', commentId).eq('is_hidden', true).select('id').maybeSingle();

  if (error) {
    console.error('[admin] comment delete failed with code', error.code);
    return fail(t.actions.commentDeleteFailed);
  }
  if (!data) {
    // Either it is gone already, or it is still visible — tell the two apart so the message is true.
    const still = await supabase.from('dish_comments').select('id').eq('id', commentId).maybeSingle();
    return fail(still.data ? t.actions.commentDeleteNeedsHidden : t.actions.commentNotIdentified);
  }

  revalidatePath('/admin', 'layout');
  return succeed(t.actions.commentDeleted, commentId);
}
