import { useState } from 'react';
import { HelpCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface AboutFaqSectionProps {
  onPlaySound?: () => void;
}

export function AboutFaqSection({ onPlaySound }: AboutFaqSectionProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is Velgre and how does the live polling work?",
      answer: "Velgre is an advanced, high-energy real-time polling and bracket tournament platform. It enables operators and creators to deploy customized voting arenas, launch tournament brackets, and craft interactive shonen-style match stories. Every vote triggers instant real-time coordinate state changes across all active connections."
    },
    {
      question: "How do I create and launch custom bracket tournaments?",
      answer: "Authorized users can initialize bracket matches through the Neural Chamber Launch console. Simply authenticate your profile, choose your matchup candidates, specify seed orders, and launch. The server-authoritative engine maintains live streams of vote metrics, calculating precise win probabilities automatically."
    },
    {
      question: "Can I use Velgre for classroom polls and group engagement?",
      answer: "Yes. Velgre includes optimized support for classroom codes, quick access tokens, and interactive spectator views. Creators can deploy custom polling dashboards on auxiliary tablet screens or share real-time bracket visualizations with students for gamified learning."
    },
    {
      question: "What features are unlocked with the Premium Operator upgrade?",
      answer: "Premium Operators gain full priority spectrum access, including spotlight pinning capabilities, permanent custom match story creation, high-fidelity sound effect synthesizers, dynamic arena style configurations, and unlimited concurrent bracket participants."
    },
    {
      question: "Are voting metrics and tournament results calculated in real-time?",
      answer: "Absolutely. Velgre utilizes high-frequency state synchronization protocols to poll and update live bracket tallies every few seconds. This guarantees real-time visual updates, elastic spring physics animations, and instantaneous match resolution for all concurrent users."
    }
  ];

  const handleToggle = (index: number) => {
    if (onPlaySound) onPlaySound();
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <section className="relative w-full max-w-6xl mx-auto px-4 pb-12 z-10" id="about-faq-arena">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start bg-white p-6 md:p-8 border-2 border-black clip-cyber-card shadow-sm">
        
        {/* Left Column: About Section (5 Columns) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-shonen-orange" />
            <span className="font-mono text-[10px] text-shonen-orange font-black tracking-widest uppercase">
              ABOUT SYSTEM // CORE PROTOCOL_05
            </span>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-black text-gray-950 uppercase tracking-tighter leading-none">
            REAL-TIME TOURNAMENT & INTERACTIVE BRACKETS
          </h2>
          
          <p className="text-gray-600 font-mono text-xs leading-relaxed text-justify">
            Velgre is a high-octane digital arena built for creators, educators, and communities who demand fast, visual, and highly responsive interactive matchmaking. Whether hosting anime power battles, conducting instant classroom polls, or organizing massive bracket tournaments, Velgre provides an unmatched real-time interactive ecosystem.
          </p>
          
          <p className="text-gray-600 font-mono text-xs leading-relaxed text-justify">
            By combining high-fidelity elastic physics with custom sound synthesis, Velgre turns standard web voting into an immersive tournament experience. Deploy your arena, stream live brackets, and let the community decide!
          </p>
        </div>

        {/* Right Column: FAQ Section (7 Columns) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-shonen-orange" />
            <span className="font-mono text-[10px] text-shonen-orange font-black tracking-widest uppercase">
              FREQUENTLY ASKED QUESTIONS // DATABASE_FAQ_01
            </span>
          </div>
          
          <h2 className="text-xl md:text-2xl font-black text-gray-950 uppercase tracking-tighter">
            SYSTEM INQUIRIES & ARENA CALIBRATION
          </h2>

          <div className="space-y-3 pt-2">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index} 
                  className="border-2 border-black transition-all bg-gray-50"
                >
                  <button
                    onClick={() => handleToggle(index)}
                    className="w-full text-left p-4 flex justify-between items-center gap-4 bg-white hover:bg-orange-50/50 transition-colors cursor-pointer group"
                  >
                    <h3 className="font-sans text-xs md:text-sm font-black text-gray-900 uppercase tracking-tight group-hover:text-shonen-orange transition-colors">
                      {faq.question}
                    </h3>
                    <div className="shrink-0 text-gray-500 group-hover:text-shonen-orange">
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </button>
                  
                  {isOpen && (
                    <div className="p-4 border-t-2 border-black bg-white">
                      <p className="text-gray-600 font-mono text-xs leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
