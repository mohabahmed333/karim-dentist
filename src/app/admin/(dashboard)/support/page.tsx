import { createClient } from "@/lib/supabase/server";
import { SupportInboxView } from "@/features/admin/components/support";
import { mapWhatsappToSupportUi } from "@/features/admin/components/support/supportWhatsappMap";
import { firstNameFromEmail } from "@/features/admin/lib/dashboardModel";
import { groupReservationsByPatient } from "@/services/reservations/patientHistory";
import { listReservationsServer } from "@/services/reservations/queries";
import {
  listConversations,
  listMessagesPage,
  listNotes,
  type WhatsappConversation,
  type WhatsappMessage,
  type WhatsappNote,
} from "@/services/whatsapp";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const agentName = auth.user?.email
    ? firstNameFromEmail(auth.user.email)
    : "Admin";

  let conversations: WhatsappConversation[] = [];
  try {
    conversations = await listConversations(supabase);
  } catch {
    conversations = [];
  }

  let patientGroups = groupReservationsByPatient([]);
  try {
    const reservations = await listReservationsServer(supabase);
    patientGroups = groupReservationsByPatient(reservations);
  } catch {
    patientGroups = [];
  }

  const messagesByConversation: Record<string, WhatsappMessage[]> = {};
  const notesByConversation: Record<string, WhatsappNote[]> = {};
  const cursorsById: Record<string, string | null> = {};

  await Promise.all(
    conversations.slice(0, 40).map(async (c) => {
      try {
        const page = await listMessagesPage(supabase, c.id, { limit: 30 });
        messagesByConversation[c.id] = page.messages;
        cursorsById[c.id] = page.nextCursor
          ? `${page.nextCursor.waTimestamp}|${page.nextCursor.id}`
          : null;
      } catch {
        messagesByConversation[c.id] = [];
        cursorsById[c.id] = null;
      }
      try {
        notesByConversation[c.id] = await listNotes(supabase, c.id);
      } catch {
        notesByConversation[c.id] = [];
      }
    }),
  );

  const mapped = mapWhatsappToSupportUi(
    conversations,
    messagesByConversation,
    notesByConversation,
    patientGroups,
    agentName,
  );

  return (
    <SupportInboxView
      conversations={mapped.uiConversations}
      detailsById={mapped.detailsById}
      messagesById={mapped.messagesById}
      openCount={mapped.openCount}
      initialCursors={cursorsById}
      useKapso
      agentName={agentName}
    />
  );
}
