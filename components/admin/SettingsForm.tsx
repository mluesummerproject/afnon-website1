'use client';

import { saveSettings } from '@/app/admin/settings-actions';
import { ActionForm } from '@/components/admin/ActionForm';
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

function TextAreaField({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
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
        placeholder="Leave empty to show nothing on the website — never a placeholder."
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
  return (
    <ActionForm action={saveSettings} className="mt-6 space-y-10">
      <fieldset className="space-y-5">
        <legend className="font-display text-display-sm text-ink">Contact</legend>
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            name="phone"
            label="Phone"
            hint="Shown as a tap-to-call button. e.g. +998 90 123 45 67"
            defaultValue={settings.phone ?? ''}
            placeholder="+998 90 123 45 67"
            type="tel"
          />
          <Field
            name="telegram_username"
            label="Telegram username"
            hint="Without the @ — used for the contact button and for every dish's order link."
            defaultValue={settings.telegram_username ?? ''}
            placeholder="afnon_restaurant"
          />
          <Field
            name="whatsapp"
            label="WhatsApp"
            hint="Full number with country code, digits only. e.g. 998901234567"
            defaultValue={settings.whatsapp ?? ''}
            placeholder="998901234567"
          />
          <Field
            name="email"
            label="Email"
            hint="A real address guests can write to."
            defaultValue={settings.email ?? ''}
            placeholder="hello@afnon.uz"
            type="email"
          />
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="font-display text-display-sm text-ink">Location &amp; hours</legend>
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            name="address"
            label="Address"
            hint="Shown exactly as typed. Leave empty to show nothing rather than a guess."
            defaultValue={settings.address ?? ''}
            placeholder="Street, district, city"
          />
          <Field
            name="working_hours"
            label="Working hours"
            hint="Shown exactly as typed, e.g. “Daily, 09:00–23:00”."
            defaultValue={settings.working_hours ?? ''}
            placeholder="Daily, 09:00–23:00"
          />
          <Field
            name="map_link"
            label="Map link"
            hint="A full https:// link — a Google Maps share link works well."
            defaultValue={settings.map_link ?? ''}
            placeholder="https://maps.google.com/…"
            type="url"
          />
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="font-display text-display-sm text-ink">About the restaurant</legend>
        <p className="text-body-sm text-ink-secondary">
          Shown on the public &ldquo;Biz haqimizda&rdquo; section, in each language. The website never invents this text — it renders exactly
          what is written here, or a neutral placeholder line if a language is left empty.
        </p>
        <div className="grid gap-5 md:grid-cols-3">
          <TextAreaField name="about_uz" label="O‘zbekcha" defaultValue={settings.about_uz ?? ''} />
          <TextAreaField name="about_ru" label="Русский" defaultValue={settings.about_ru ?? ''} />
          <TextAreaField name="about_en" label="English" defaultValue={settings.about_en ?? ''} />
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="font-display text-display-sm text-ink">Social</legend>
        <div className="grid gap-5 md:grid-cols-2">
          {(['instagram', 'facebook', 'tiktok', 'youtube'] as const).map((key) => (
            <Field
              key={key}
              name={key}
              label={key[0].toUpperCase() + key.slice(1)}
              hint="A full https:// link to the profile or page."
              defaultValue={settings[key] ?? ''}
              placeholder={`https://${key}.com/…`}
              type="url"
            />
          ))}
        </div>
      </fieldset>

      <SubmitButton pendingLabel="Saving…" className="min-h-[3.25rem] w-full md:w-auto">
        Save settings
      </SubmitButton>
    </ActionForm>
  );
}
