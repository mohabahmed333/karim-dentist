# Clinic Assist — Book choice with active patient

Date: 2026-09-08

## Behavior

When **Book** is tapped and Clinic Assist has an active patient (e.g. opened from WhatsApp Ask AI):

1. Assistant asks: replace existing booking **or** reserve for this chat.
2. **Replace reservation** → find open reservation → pick new day/slot (same as replace path). If none, offer **Reserve for the chat**.
3. **Reserve for the chat** → book panel prefilled with that patient’s name/phone.

With no active patient, **Book** opens the book panel as before.
