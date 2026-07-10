import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SITE_NAME } from "@/lib/site";

const faqs = [
  {
    q: "How does the analysis work?",
    a: "You answer thoughtful questions about your relationship situation. We send your full answers — not scores — to an AI trained to think like a relationship psychologist. It returns a personalized report with flags, patterns, and advice.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your answers are stored securely and only accessible to you. You can delete reports anytime from your dashboard. We never sell your data.",
  },
  {
    q: "Can AI really understand relationships?",
    a: "AI can't read minds, and we never claim it can. Our analysis identifies patterns in what you've observed and offers thoughtful interpretations — always with appropriate uncertainty.",
  },
  {
    q: "Is this a replacement for therapy?",
    a: `No. ${SITE_NAME} is a self-reflection tool, not professional therapy or counseling. If you're in distress, please reach out to a qualified mental health professional.`,
  },
];

export function FAQ() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <div className="rounded-3xl bg-white/50 px-6 py-10 backdrop-blur-sm dark:bg-card/30">
      <h2 className="mb-8 text-center text-3xl font-semibold tracking-tight">
        Frequently asked questions
      </h2>
      <Accordion className="w-full">
        {faqs.map((faq) => (
          <AccordionItem key={faq.q} value={faq.q}>
            <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      </div>
    </section>
  );
}
