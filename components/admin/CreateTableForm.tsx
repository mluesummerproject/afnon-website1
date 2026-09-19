'use client';

import { useRef } from 'react';

import { createTable } from '@/app/admin/table-actions';
import { ActionForm } from '@/components/admin/ActionForm';
import { useT } from '@/components/admin/AdminLangProvider';
import { SubmitButton } from '@/components/admin/SubmitButton';
import type { ActionResult } from '@/lib/admin-types';

export function CreateTableForm() {
  const t = useT();
  const formRef = useRef<HTMLFormElement>(null);

  const onResult = (result: NonNullable<ActionResult>) => {
    if (result.ok) formRef.current?.reset();
  };

  return (
    <ActionForm action={createTable} formRef={formRef} onResult={onResult} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="new-table-number" className="text-body-sm font-medium text-ink">
          {t.tables.numberLabel}
        </label>
        <input
          id="new-table-number"
          name="table_number"
          maxLength={20}
          placeholder={t.tables.numberPlaceholder}
          className="field mt-2 border-line-strong"
          autoComplete="off"
        />
      </div>
      <SubmitButton pendingLabel={t.tables.creating} className="shrink-0">
        {t.tables.create}
      </SubmitButton>
    </ActionForm>
  );
}
