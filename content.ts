// ─────────────────────────────────────────────────────────────
// Everything the video says lives here. Edit this file, not the scene.
// ─────────────────────────────────────────────────────────────

export const INPUTS = {
  url: 'https://jbautomations.github.io/',
  brand: 'JB Automations',
  closing: "Your customers forget. Ours don't.",
  tail: 'Start your free 20-day trial.',
};

// Only put a number here once you've measured it with real clients
// (e.g. '42%'). While it is null the chip says "Fewer no shows" instead
// of showing a percentage.
export const MEASURED_NO_SHOW_REDUCTION: string | null = null;

export type Chip = {value: string; label: string};
export const chips: Chip[] = [
  MEASURED_NO_SHOW_REDUCTION
    ? {value: MEASURED_NO_SHOW_REDUCTION, label: 'Average reduction in no shows'}
    : {value: 'Fewer', label: 'no shows with automatic reminders'},
  {value: '24hrs', label: 'Automatic reminder window'},
  {value: '0', label: 'Effort required from you'},
];

export const steps = [
  {n: '01', title: 'You add the appointment', body: "Add the booking to Google Calendar with the customer's name and number."},
  {n: '02', title: 'The system detects it', body: 'Your calendar is checked every hour for appointments in the next 24 hours.'},
  {n: '03', title: 'A tailored text is written', body: 'Each reminder uses the customer’s name and appointment details.'},
  {n: '04', title: 'Customer gets the text', body: 'They reply YES to confirm, or call you to reschedule.'},
];

export const scheduler = {
  title: 'Today',
  badge: 'Auto reminders on',
  rows: [
    {time: '9:00', name: 'Sarah', status: 'Reminder sent', done: true},
    {time: '10:30', name: 'Tom', status: 'Reminder sent', done: true},
    {time: '1:30', name: 'Priya', status: 'Confirmed', done: true},
    {time: '3:00', name: 'Daniel', status: 'Queued', done: false},
  ],
};

export type Bubble = {from: 'biz' | 'client'; text: string};
export const smsBubbles: Bubble[] = [
  {from: 'biz', text: "Hi Sarah, reminder: you're booked tomorrow at 2:00pm. Reply YES to confirm."},
  {from: 'client', text: 'YES'},
  {from: 'biz', text: 'Thanks Sarah, see you then!'},
];

export const services = [
  {title: 'Free 20-day trial', body: 'See it working before you spend a cent.'},
  {title: 'Appointment reminders', body: 'Automatic texts before every appointment.'},
  {title: 'Social media', body: 'Weekly content created and scheduled for you.'},
  {title: 'Website creation', body: 'A professional site with a booking button.'},
];

// ── The lifted row ───────────────────────────────────────────
// 'after-appointment' (default) shows the post-appointment review text.
// 'testimonials' shows real client quotes — but ONLY ones marked
// verified: true. Set that flag only for real clients who agreed to be quoted.
export const ROW_MODE: 'after-appointment' | 'testimonials' = 'after-appointment';

export type RowCard = {kind: 'sms' | 'quote' | 'info'; title: string; subtitle?: string; body: string};

const afterAppointment: RowCard[] = [
  {
    kind: 'sms',
    title: 'Thank-you text',
    body: 'Thanks for coming in, Sarah! If you have 2 minutes, a quick Google review would mean a lot.',
  },
  {kind: 'info', title: 'Review link', body: 'A direct link to your Google review page goes out with it.'},
  {kind: 'info', title: 'Follow-up', body: 'A friendly check-in keeps clients coming back.'},
];

export type Testimonial = {name: string; role: string; quote: string; verified: boolean};
export const testimonials: Testimonial[] = [
  // Example only. Replace with real quotes, then set verified: true.
  {name: 'Client name', role: 'Owner, Business name', quote: 'Real quote goes here.', verified: false},
];

export function getRow(): {heading: string; sub: string; cards: RowCard[]} {
  if (ROW_MODE === 'testimonials') {
    const real = testimonials.filter((t) => t.verified).slice(0, 3);
    if (real.length > 0) {
      return {
        heading: 'What Adelaide businesses say',
        sub: 'Real clients, in their own words.',
        cards: real.map((t) => ({kind: 'quote' as const, title: t.name, subtitle: t.role, body: t.quote})),
      };
    }
  }
  return {heading: 'After every appointment', sub: 'The part most businesses forget.', cards: afterAppointment};
}
