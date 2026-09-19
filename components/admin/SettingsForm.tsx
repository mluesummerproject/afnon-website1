'use client';

import { saveSettings } from '@/app/admin/settings-actions';
import { ActionForm } from '@/components/admin/ActionForm';
import { useT } from '@/components/admin/AdminLangProvider';
import { SubmitButton } from '@/components/admin/SubmitButton';
import type { StoredSettings } from '@/lib/settings-core';

function Field({
  name,
  label,
  hint,
  defaultValue,
  placeholder,
  type = 'text',
}: {
  name: string;
  label: string;
  hint: string;
  defaultValue: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={`settings-${name}`} className="text-body-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={`settings-${name}`}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        maxLength={500}
        className="field mt-2 border-line-strong"
        autoComplete="off"
      />
      <p className="mt-1.5 text-micro text-ink-muted">{hint}</p>
    </div>
  );
}

function TextAreaField({ name, label, defaultValue, placeholder }: { name: string; label: string; defaultValue: string; placeholder: string }) {
  return (
    <div>
      <label htmlFor={`settings-${name}`} className="text-body-sm font-medium text-ink">
        {label}
      </label>
      <textarea
        id={`settings-${name}`}
        name={name}
        rows={5}
        defaultValue={defaultValue}
        maxLength={4000}
        placeholder={placeholder}
        className="field mt-2 border-line-strong"
      />
    </div>
  );
}

/**
 * Every field is optional: leave it empty and the website falls back to its
 * built-in default text. Nothing here is invented — an empty field simply
 * shows nothing rather than a placeholder, per the no-fabrication rule.
 */
export function SettingsForm({ settings }: { settings: StoredSettings }) {
  const t = useT();
  return (
    <ActionForm action={saveSettings} className="mt-6 space-y-10">
      <fieldset className="space-y-5">
        <legend className="font-display text-display-sm text-ink">{t.settings.contact}</legend>
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            name="phone"
            label={t.settings.phone}
            hint={t.settings.phoneHint}
            defaultValue={settings.phone ?? ''}
            placeholder="+998 90 123 45 67"
            type="tel"
          />
          <Field
            name="telegram_username"
            label={t.settings.telegram}
            hint={t.settings.telegramHint}
            defaultValue={settings.telegram_username ?? ''}
            placeholder="afnon_restaurant"
          />
          <Field
            name="whatsapp"
            label={t.settings.whatsapp}
            hint={t.settings.whatsappHint}
            defaultValue={settings.whatsapp ?? ''}
            placeholder="998901234567"
          />
          <Field
            name="email"
            label={t.settings.email}
            hint={t.settings.emailHint}
            defaultValue={settings.email ?? ''}
            placeholder="hello@afnon.uz"
            type="email"
          />
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="font-display text-display-sm text-ink">{t.settings.location}</legend>
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            name="address"
            label={t.settings.address}
            hint={t.settings.addressHint}
            defaultValue={settings.address ?? ''}
            placeholder={t.settings.addressPlaceholder}
          />
          <Field
            name="working_hours"
            label={t.settings.hours}
            hint={t.settings.hoursHint}
            defaultValue={settings.working_hours ?? ''}
            placeholder={t.settings.hoursPlaceholder}
          />
          <Field
            name="map_link"
            label={t.settings.map}
            hint={t.settings.mapHint}
            defaultValue={settings.map_link ?? ''}
            placeholder="https://maps.google.com/…"
            type="url"
          />
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="font-display text-display-sm text-ink">{t.settings.about}</legend>
        <p className="text-body-sm text-ink-secondary">{t.settings.aboutHint}</p>
        <div className="grid gap-5 md:grid-cols-3">
          <TextAreaField name="about_uz" label={t.form.uz} defaultValue={settings.about_uz ?? ''} placeholder={t.settings.aboutPlaceholder} />
          <TextAreaField name="about_ru" label={t.form.ru} defaultValue={settings.about_ru ?? ''} placeholder={t.settings.aboutPlaceholder} />
          <TextAreaField name="about_en" label={t.form.en} defaultValue={settings.about_en ?? ''} placeholder={t.settings.aboutPlaceholder} />
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="font-display text-display-sm text-ink">{t.settings.social}</legend>
        <div className="grid gap-5 md:grid-cols-2">
          {(
            [
              ['instagram', 'Instagram'],
              ['facebook', 'Facebook'],
              ['tiktok', 'TikTok'],
              ['youtube', 'YouTube'],
            ] as const
          ).map(([key, label]) => (
            <Field
              key={key}
              name={key}
              label={label}
              hint={t.settings.socialHint}
              defaultValue={settings[key] ?? ''}
              placeholder={`https://${key}.com/…`}
              type="url"
            />
          ))}
        </div>
      </fieldset>

      <SubmitButton pendingLabel={t.settings.saving} savedLabel={t.toast.savedShort} className="min-h-[3.25rem] w-full md:w-auto">
        {t.settings.save}
      </SubmitButton>
    </ActionForm>
  );
}
