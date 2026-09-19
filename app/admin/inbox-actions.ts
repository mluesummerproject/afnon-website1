'use server';

import { revalidatePath } from 'next/cache';

import { fail, requireAdmin, succeed, toId, type ActionResult } from '@/lib/admin';
import { getAdminDict } from '@/lib/admin-locale';
import { format } from '@/lib/i18n';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/** Marks one message read or unread. Messages are only ever read and changed here, server-side. */
export async function setMessageRead(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  requireAdmin();

  const t = getAdminDict();
  const id = toId(formData.get('id'));
  if (id === null) return fail(t.actions.messageNotIdentified);
  const read = formData.get('read') === 'true';

  const { data, error } = await getSupabaseAdmin()
    .from('messages')
    .update({ is_read: read })
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) return fail(format(t.actions.messageUpdateFailed, { reason: error.message }));
  if (!data) return fail(t.actions.messageGone);

  revalidatePath('/admin', 'layout');
  return succeed(read ? t.actions.markedRead : t.actions.markedUnread, id);
}

/** Marks one piece of table feedback read or unread — the same shape as setMessageRead, one table over. */
export async function setFeedbackRead(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  requireAdmin();

  const t = getAdminDict();
  const id = toId(formData.get('id'));
  if (id === null) return fail(t.actions.feedbackNotIdentified);
  const read = formData.get('read') === 'true';

  const { data, error } = await getSupabaseAdmin()
    .from('feedback')
    .update({ status: read ? 'read' : 'new' })
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) return fail(format(t.actions.feedbackUpdateFailed, { reason: error.message }));
  if (!data) return fail(t.actions.feedbackNotIdentified);

  revalidatePath('/admin', 'layout');
  return succeed(read ? t.actions.feedbackMarkedRead : t.actions.feedbackMarkedUnread, id);
}
