import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const App = () => (
  <TooltipProvider>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Conversational Agent Workshop
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Real-time audio transcription with Deepgram
            </p>
          </header>

          <main className="space-y-6">
            {/* Audio recorder component will go here */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
              <p className="text-center text-slate-500 dark:text-slate-400">
                Audio recorder component will be added here
              </p>
            </div>

            {/* Transcription display will go here */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
              <p className="text-center text-slate-500 dark:text-slate-400">
                Transcription will appear here
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
    <Toaster />
    <Sonner />
  </TooltipProvider>
);

export default App;