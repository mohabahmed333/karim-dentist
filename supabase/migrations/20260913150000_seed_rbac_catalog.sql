-- Permission catalog covering every admin page + its actions, plus the
-- seeded "Owner" role granted all of them (so the existing bootstrap admin
-- keeps full access once backfilled onto it in the next migration).
-- Rollback:
--   DELETE FROM public.role_permissions WHERE role_id IN (SELECT id FROM public.roles WHERE key = 'owner');
--   DELETE FROM public.roles WHERE key IN ('owner', 'front-desk');
--   DELETE FROM public.permissions;

INSERT INTO public.permissions (key, category, label, sort_order) VALUES
  ('dashboard.view', 'dashboard', 'View dashboard overview', 10),

  ('reservations.view', 'reservations', 'View reservations', 20),
  ('reservations.create', 'reservations', 'Create reservation', 21),
  ('reservations.edit', 'reservations', 'Edit reservation', 22),
  ('reservations.confirm', 'reservations', 'Confirm reservation', 23),
  ('reservations.cancel', 'reservations', 'Cancel reservation', 24),
  ('reservations.regenerate-slots', 'reservations', 'Regenerate booking slots', 25),

  ('waitlist.view', 'waitlist', 'View waitlist', 30),
  ('waitlist.edit', 'waitlist', 'Edit waitlist entry', 31),
  ('waitlist.remove', 'waitlist', 'Remove waitlist entry', 32),

  ('patients.view', 'patients', 'View patient directory', 40),
  ('patients.edit', 'patients', 'Edit patient profile', 41),
  ('patients.chart.edit', 'patients', 'Edit dental chart', 42),
  ('patients.notes.edit', 'patients', 'Edit clinical notes', 43),
  ('patients.treatments.edit', 'patients', 'Edit treatments', 44),
  ('patients.imaging.upload', 'patients', 'Upload patient imaging', 45),

  ('support.view', 'support', 'View WhatsApp support inbox', 50),
  ('support.reply', 'support', 'Reply to a conversation', 51),
  ('whatsapp.conversations.assign', 'support', 'Assign conversation to staff', 52),
  ('whatsapp.conversations.mute', 'support', 'Mute conversation', 53),
  ('whatsapp.conversations.star', 'support', 'Star conversation', 54),
  ('whatsapp.conversations.tags', 'support', 'Tag conversation', 55),
  ('whatsapp.canned-replies.manage', 'support', 'Manage canned replies', 56),
  ('whatsapp.templates.manage', 'support', 'Manage WhatsApp templates', 57),

  ('quick-replies.view', 'quick-replies', 'View quick replies', 60),
  ('quick-replies.create', 'quick-replies', 'Create quick reply', 61),
  ('quick-replies.edit', 'quick-replies', 'Edit quick reply', 62),
  ('quick-replies.delete', 'quick-replies', 'Delete quick reply', 63),

  ('knowledge.view', 'knowledge', 'View clinic knowledge base', 70),
  ('knowledge.create', 'knowledge', 'Create knowledge entry', 71),
  ('knowledge.edit', 'knowledge', 'Edit knowledge entry', 72),
  ('knowledge.delete', 'knowledge', 'Delete knowledge entry', 73),

  ('assistant-review.view', 'assistant-review', 'View AI assistant review queue', 80),
  ('assistant-review.approve', 'assistant-review', 'Approve AI-proposed action', 81),
  ('assistant-review.reject', 'assistant-review', 'Reject AI-proposed action', 82),

  ('outbox.view', 'outbox', 'View notification outbox', 90),
  ('outbox.resend', 'outbox', 'Resend a notification', 91),

  ('customize.view', 'customize', 'View page builder', 100),
  ('customize.edit', 'customize', 'Edit page sections', 101),

  ('usage.view', 'usage', 'View platform usage dashboard', 110),
  ('assist-analytics.view', 'usage', 'View AI assistant analytics', 111),

  ('hero.view', 'hero', 'View hero section', 120),
  ('hero.edit', 'hero', 'Edit hero section', 121),

  ('about.view', 'about', 'View about section', 130),
  ('about.edit', 'about', 'Edit about section', 131),

  ('callout.view', 'callout', 'View callout banner', 140),
  ('callout.edit', 'callout', 'Edit callout banner', 141),

  ('case-studies.view', 'case-studies', 'View case studies', 150),
  ('case-studies.create', 'case-studies', 'Create case study', 151),
  ('case-studies.edit', 'case-studies', 'Edit case study', 152),
  ('case-studies.delete', 'case-studies', 'Delete case study', 153),
  ('case-studies.publish', 'case-studies', 'Publish/unpublish case study', 154),

  ('featured.view', 'featured', 'View featured projects', 160),
  ('featured.create', 'featured', 'Create featured project', 161),
  ('featured.edit', 'featured', 'Edit featured project', 162),
  ('featured.delete', 'featured', 'Delete featured project', 163),
  ('featured.publish', 'featured', 'Publish/unpublish featured project', 164),

  ('services.view', 'services', 'View services catalog', 170),
  ('services.create', 'services', 'Create service', 171),
  ('services.edit', 'services', 'Edit service', 172),
  ('services.delete', 'services', 'Delete service', 173),

  ('experience.view', 'experience', 'View experience entries', 180),
  ('experience.create', 'experience', 'Create experience entry', 181),
  ('experience.edit', 'experience', 'Edit experience entry', 182),
  ('experience.delete', 'experience', 'Delete experience entry', 183),

  ('clients.view', 'clients', 'View client logos', 190),
  ('clients.create', 'clients', 'Create client logo', 191),
  ('clients.edit', 'clients', 'Edit client logo', 192),
  ('clients.delete', 'clients', 'Delete client logo', 193),

  ('faq.view', 'faq', 'View FAQs', 200),
  ('faq.create', 'faq', 'Create FAQ', 201),
  ('faq.edit', 'faq', 'Edit FAQ', 202),
  ('faq.delete', 'faq', 'Delete FAQ', 203),

  ('gallery.view', 'gallery', 'View media gallery', 210),
  ('gallery.upload', 'gallery', 'Upload media', 211),
  ('gallery.delete', 'gallery', 'Delete media', 212),

  ('slider.view', 'slider', 'View homepage slider', 220),
  ('slider.upload', 'slider', 'Upload slide', 221),
  ('slider.delete', 'slider', 'Delete slide', 222),

  ('contact.view', 'contact', 'View contact section', 230),
  ('contact.edit', 'contact', 'Edit contact section', 231),

  ('footer-links.view', 'footer-links', 'View footer links', 240),
  ('footer-links.edit', 'footer-links', 'Edit footer links', 241),

  ('homepage-order.view', 'homepage-order', 'View homepage section order', 250),
  ('homepage-order.edit', 'homepage-order', 'Reorder homepage sections', 251),

  ('settings.view', 'settings', 'View clinic/site settings', 260),
  ('settings.edit', 'settings', 'Edit clinic/site settings', 261),

  ('accounts.view', 'accounts', 'View staff accounts', 270),
  ('accounts.create', 'accounts', 'Create staff account', 271),
  ('accounts.edit', 'accounts', 'Edit staff account / change role', 272),
  ('accounts.deactivate', 'accounts', 'Deactivate staff account', 273),

  ('roles.view', 'roles', 'View roles', 280),
  ('roles.create', 'roles', 'Create role', 281),
  ('roles.edit', 'roles', 'Edit role permissions', 282),
  ('roles.delete', 'roles', 'Delete role', 283)
ON CONFLICT (key) DO UPDATE
SET category = EXCLUDED.category,
    label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order;

INSERT INTO public.roles (key, name, description, is_admin_role, is_system)
VALUES ('owner', 'Owner', 'Full access to every page and action.', true, true)
ON CONFLICT (key) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_admin_role = true,
    is_system = true,
    deleted_at = NULL,
    updated_at = now();

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.key = 'owner'
ON CONFLICT DO NOTHING;

-- A starter limited role, useful as a template to clone from the Roles UI.
INSERT INTO public.roles (key, name, description, is_admin_role, is_system)
VALUES ('front-desk', 'Front Desk', 'Reservations, waitlist, patients (read), and support.', true, false)
ON CONFLICT (key) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.key = 'front-desk'
  AND p.key IN (
    'dashboard.view',
    'reservations.view', 'reservations.create', 'reservations.edit',
    'reservations.confirm', 'reservations.cancel',
    'waitlist.view', 'waitlist.edit', 'waitlist.remove',
    'patients.view',
    'support.view', 'support.reply'
  )
ON CONFLICT DO NOTHING;
