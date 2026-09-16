'use server';

import { revalidatePath } from 'next/cache';

import { fail, requireAdmin, succeed, toId, type ActionResult } from '@/lib/admin';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/** Marks one message read or unread. Messages are only ever read and changed here, server-side. */
export async function setMessageRead(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  requireAdmin();

  const id = toId(formData.get('id'));
  if (id === null) return fail('That message could not be identified.');
  const read = formData.get('read') === 'true';

  const { data, error } = await getSupabaseAdmin()
    .from('messages')
    .update({ is_read: read })
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) return fail(`Could not update the message: ${error.message}`);
  if (!data) return fail('That message no longer exists.');

  revalidatePath('/admin', 'layout');
  return succeed(read ? 'Marked as read.' : 'Marked as unread.', id);
}
