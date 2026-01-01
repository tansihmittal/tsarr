import { ReactNode, useState, useMemo } from "react";
import { IoMdOptions } from "react-icons/io";
import { BsInfoCircle, BsCheckCircle, BsMagic } from "react-icons/bs";
import { useTTSContext } from "@/context/TTS";

interface Props { }

const TTSControlPanel: React.FC<Props> = () => {
  const [selectedOption, setSelectedOption] = useState("options");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const { settings, updateSettings, deviceInfo, text, setText, voices, profiles, applyProfile } = useTTSContext();

  // Get unique languages
  const languages = useMemo(() => {
    const langSet = new Set(voices.map(v => v.lang));
    return Array.from(langSet).sort();
  }, [voices]);

  // Filter voices
  const filteredVoices = useMemo(() => {
    return voices.filter(v => {
      if (languageFilter !== "all" && v.lang !== languageFilter) return false;
      if (genderFilter !== "all" && v.gender !== genderFilter) return false;
      return true;
    });
  }, [voices, languageFilter, genderFilter]);

  const PanelHeading = ({ title }: { title: string }) => (
    <div className="px-4 py-3 border-b border-base-200/60 bg-base-200/30">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</span>
    </div>
  );

  const OptionButton = ({ title, children }: { children: ReactNode; title: string }) => {
    const triggerValue = title.toLowerCase();
    const isActive = selectedOption === triggerValue;
    return (
      <div
        className={`flex justify-center items-center gap-2 font-medium px-4 py-2.5 transition-all duration-200 cursor-pointer ${isActive ? "bg-base-100 rounded-lg shadow-sm text-primary" : "text-primary-content hover:text-primary"
          }`}
        onClick={() => setSelectedOption(triggerValue)}
      >
        <span className={`transition-transform duration-200 ${isActive ? "scale-110" : ""}`}>{children}</span>
        <span>{title}</span>
      </div>
    );
  };

  const quickTemplates = [
    "Hello! Welcome to our text-to-speech demo.",
    "The quick brown fox jumps over the lazy dog.",
    "Kokoro is an 82 million parameter neural TTS model with 28 voices.",
    "This is a test of the emergency broadcast system.",
  ];

  const langNames: Record<string, string> = {
    "en-US": "🇺🇸 US English",
    "en-GB": "🇬🇧 UK English",
  };

  return (
    <section className="flex flex-col transition-opacity duration-300">
      <div className="grid grid-cols-3 bg-base-200/60 rounded-xl p-1 mb-3 cursor-pointer backdrop-blur-sm">
        <OptionButton title="Options"><IoMdOptions /></OptionButton>
        <OptionButton title="Effects"><BsMagic /></OptionButton>
        <OptionButton title="Info"><BsInfoCircle /></OptionButton>
      </div>

      {selectedOption === "options" ? (
        <div className="rounded-xl border border-base-200/80 bg-base-100 shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
          {/* Voice Selection */}
          <PanelHeading title={`Voice (${filteredVoices.length} of ${voices.length})`} />
          <div className="p-4 border-b border-base-200/60">
            {/* Filters */}
            <div className="flex gap-2 mb-3">
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="select select-sm select-bordered flex-1"
              >
                <option value="all">All Languages</option>
                {languages.map(lang => (
                  <option key={lang} value={lang}>{langNames[lang] || lang}</option>
                ))}
              </select>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="select select-sm select-bordered"
              >
                <option value="all">All</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>

            {/* Voice Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto">
              {filteredVoices.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => updateSettings("voice", voice.id)}
                  className={`p-2.5 rounded-lg border-2 text-left transition-all duration-200 ${settings.voice === voice.id
                      ? "border-primary bg-primary/10"
                      : "border-base-200 hover:border-primary/30"
                    }`}
                >
                  <p className={`text-sm font-medium truncate ${settings.voice === voice.id ? "text-primary" : ""}`}>
                    {voice.name}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate">{voice.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Blending */}
          <PanelHeading title="Voice Blending" />
          <div className="p-4 border-b border-base-200/60">
            <p className="text-xs text-gray-500 mb-3">Blend two voices together for unique combinations</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Secondary Voice</label>
                <select
                  value={settings.voice2}
                  onChange={(e) => updateSettings("voice2", e.target.value)}
                  className="select select-sm select-bordered w-full"
                >
                  <option value="">None (disabled)</option>
                  {voices.filter(v => v.id !== settings.voice).map(voice => (
                    <option key={voice.id} value={voice.id}>{voice.name}</option>
                  ))}
                </select>
              </div>
              {settings.voice2 && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">Blend Ratio</span>
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {Math.round(settings.blendRatio * 100)}%
                    </span>
                  </div>
                  <input
                    type="range" min="0" max="1" step="0.05"
                    value={settings.blendRatio}
                    onChange={(e) => updateSettings("blendRatio", parseFloat(e.target.value))}
                    className="range range-xs range-primary w-full"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>{voices.find(v => v.id === settings.voice)?.name || "Voice 1"}</span>
                    <span>{voices.find(v => v.id === settings.voice2)?.name || "Voice 2"}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Speed Control */}
          <PanelHeading title="Speed" />
          <div className="p-4 border-b border-base-200/60">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-gray-500 font-medium">Speed</span>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {settings.speed.toFixed(1)}x
              </span>
            </div>
            <input
              type="range" min="0.5" max="2.0" step="0.1"
              value={settings.speed}
              onChange={(e) => updateSettings("speed", parseFloat(e.target.value))}
              className="range range-xs range-primary w-full"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>0.5x</span><span>1.0x</span><span>2.0x</span>
            </div>
          </div>

          {/* Quick Templates */}
          <PanelHeading title="Templates" />
          <div className="p-4">
            <div className="space-y-2">
              {quickTemplates.map((template, i) => (
                <button
                  key={i}
                  onClick={() => setText(template)}
                  className="w-full p-3 text-left text-sm bg-base-200/50 hover:bg-base-200 rounded-lg transition-colors"
                >
                  {template}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : selectedOption === "effects" ? (
        <div className="rounded-xl border border-base-200/80 bg-base-100 shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
          {/* Voice Profiles */}
          <PanelHeading title="Voice Profiles" />
          <div className="p-4 border-b border-base-200/60">
            <p className="text-xs text-gray-500 mb-3">Quick presets for instant voice transformations</p>
            <div className="grid grid-cols-3 gap-2">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => applyProfile(profile.id)}
                  className={`p-2.5 rounded-lg border-2 text-center transition-all duration-200 ${settings.voiceProfile === profile.id
                      ? "border-primary bg-primary/10"
                      : "border-base-200 hover:border-primary/30"
                    }`}
                >
                  <span className="text-xl block mb-0.5">{profile.icon}</span>
                  <p className={`text-[10px] font-medium ${settings.voiceProfile === profile.id ? "text-primary" : ""}`}>
                    {profile.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Pitch Control */}
          <PanelHeading title="Pitch Shift" />
          <div className="p-4 border-b border-base-200/60">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-gray-500 font-medium">Pitch</span>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {settings.pitch > 0 ? "+" : ""}{settings.pitch} semitones
              </span>
            </div>
            <input
              type="range" min="-12" max="12" step="1"
              value={settings.pitch}
              onChange={(e) => {
                updateSettings("pitch", parseInt(e.target.value));
                updateSettings("voiceProfile", "custom");
              }}
              className="range range-xs range-secondary w-full"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>-12 (Lower)</span><span>0</span><span>+12 (Higher)</span>
            </div>
          </div>

          {/* Reverb Control */}
          <PanelHeading title="Reverb" />
          <div className="p-4 border-b border-base-200/60">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-gray-500 font-medium">Reverb Amount</span>
              <span className="text-xs font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                {Math.round(settings.reverb * 100)}%
              </span>
            </div>
            <input
              type="range" min="0" max="1" step="0.05"
              value={settings.reverb}
              onChange={(e) => {
                updateSettings("reverb", parseFloat(e.target.value));
                updateSettings("voiceProfile", "custom");
              }}
              className="range range-xs range-secondary w-full"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>Dry</span><span>50%</span><span>Wet</span>
            </div>
          </div>

          {/* Current Profile Info */}
          <PanelHeading title="Current Settings" />
          <div className="p-4">
            <div className="p-4 bg-base-200/30 rounded-xl space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Profile</span>
                <span className="font-medium capitalize">{settings.voiceProfile}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Pitch</span>
                <span className="font-medium">{settings.pitch > 0 ? "+" : ""}{settings.pitch} st</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Reverb</span>
                <span className="font-medium">{Math.round(settings.reverb * 100)}%</span>
              </div>
              {settings.voice2 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Blending</span>
                  <span className="font-medium">{Math.round(settings.blendRatio * 100)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-base-200/80 bg-base-100 shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
          {/* Device Info */}
          <PanelHeading title="Device Info" />
          <div className="p-4 border-b border-base-200/60">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">GPU Acceleration</span>
                <span className={`text-sm font-medium px-3 py-1 rounded-full flex items-center gap-1 ${deviceInfo.hasWebGPU ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                  {deviceInfo.hasWebGPU && <BsCheckCircle className="text-xs" />}
                  {deviceInfo.hasWebGPU ? "WebGPU" : "CPU (WASM)"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">CPU Cores</span>
                <span className="text-sm font-medium">{deviceInfo.cores}</span>
              </div>
              {deviceInfo.memory && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Memory</span>
                  <span className="text-sm font-medium">{deviceInfo.memory} GB</span>
                </div>
              )}
            </div>
          </div>

          {/* About */}
          <PanelHeading title="About Kokoro TTS" />
          <div className="p-4 border-b border-base-200/60">
            <div className="p-4 bg-base-200/30 rounded-xl">
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 82M parameter neural TTS model</li>
                <li>• <strong>28 voices</strong> (US & UK English)</li>
                <li>• Voice blending support</li>
                <li>• 12 voice effect profiles</li>
                <li>• Pitch & reverb controls</li>
                <li>• Intelligent text chunking</li>
                <li>• GPU acceleration (WebGPU)</li>
                <li>• Runs 100% in browser</li>
                <li>• ~50MB download (cached)</li>
              </ul>
            </div>
          </div>

          {/* Voices by Language */}
          <PanelHeading title="Available Voices" />
          <div className="p-4 border-b border-base-200/60">
            <div className="space-y-2 text-sm">
              {Object.entries(langNames).map(([code, name]) => (
                <div key={code} className="flex items-center justify-between p-2 bg-base-200/30 rounded-lg">
                  <span>{name}</span>
                  <span className="text-xs text-gray-500 bg-base-200 px-2 py-0.5 rounded-full">
                    {voices.filter(v => v.lang === code).length} voices
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Session */}
          <PanelHeading title="Session" />
          <div className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Characters</span>
                <span className="text-sm font-medium">{text.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Voice</span>
                <span className="text-sm font-medium">{voices.find(v => v.id === settings.voice)?.name || settings.voice}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Profile</span>
                <span className="text-sm font-medium capitalize">{settings.voiceProfile}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default TTSControlPanel;
