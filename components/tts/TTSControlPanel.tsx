import { useState, useMemo } from "react";
import ControlPanelHeading from "../common/ControlPanelHeading";
import { IoMdOptions } from "react-icons/io";
import { BsInfoCircle, BsCheckCircle, BsMagic } from "react-icons/bs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTTSContext } from "@/context/TTS";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface Props { }

const TTSControlPanel: React.FC<Props> = () => {
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

  const PanelHeading = ControlPanelHeading;

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
      <Tabs defaultValue="options">
      <TabsList className="w-full grid grid-cols-3 rounded-[12px] bg-[#F9FAFB] mb-3">
        <TabsTrigger value="options" className="gap-1.5 rounded-[10px] text-xs"><IoMdOptions className="w-3.5 h-3.5" /> Options</TabsTrigger>
        <TabsTrigger value="effects" className="gap-1.5 rounded-[10px] text-xs"><BsMagic className="w-3.5 h-3.5" /> Effects</TabsTrigger>
        <TabsTrigger value="info" className="gap-1.5 rounded-[10px] text-xs"><BsInfoCircle className="w-3.5 h-3.5" /> Info</TabsTrigger>
      </TabsList>

      <TabsContent value="options">
        <div className="rounded-[14px] border border-[#E5E7EB] bg-white shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
          {/* Voice Selection */}
          <PanelHeading title={`Voice (${filteredVoices.length} of ${voices.length})`} />
          <div className="p-4 border-b border-[#E5E7EB]">
            {/* Filters */}
            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <Select value={languageFilter} onValueChange={setLanguageFilter}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    {languages.map(lang => (
                      <SelectItem key={lang} value={lang}>{langNames[lang] || lang}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Voice Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto">
              {filteredVoices.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => updateSettings("voice", voice.id)}
                  className={`p-2.5 rounded-[10px] border-2 text-left transition-all duration-200 ${settings.voice === voice.id
                      ? "border-[#2563EB] bg-[#2563EB]/10"
                      : "border-[#E5E7EB] hover:border-[#2563EB]/30"
                    }`}
                >
                  <p className={`text-sm font-medium truncate ${settings.voice === voice.id ? "text-[#2563EB]" : ""}`}>
                    {voice.name}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate">{voice.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Blending */}
          <PanelHeading title="Voice Blending" />
          <div className="p-4 border-b border-[#E5E7EB]">
            <p className="text-xs text-gray-500 mb-3">Blend two voices together for unique combinations</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Secondary Voice</label>
                <Select value={settings.voice2 || "__none__"} onValueChange={(v) => updateSettings("voice2", v === "__none__" ? "" : v)}>
                  <SelectTrigger className="h-9 text-sm w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None (disabled)</SelectItem>
                    {voices.filter(v => v.id !== settings.voice).map(voice => (
                      <SelectItem key={voice.id} value={voice.id}>{voice.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {settings.voice2 && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">Blend Ratio</span>
                    <span className="text-xs font-semibold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">
                      {Math.round(settings.blendRatio * 100)}%
                    </span>
                  </div>
                  <Slider
                    min={0} max={1} step={0.05}
                    value={[settings.blendRatio]}
                    onValueChange={([v]) => updateSettings("blendRatio", v)}
                    className="w-full"
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
          <div className="p-4 border-b border-[#E5E7EB]">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-gray-500 font-medium">Speed</span>
              <span className="text-xs font-semibold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">
                {settings.speed.toFixed(1)}x
              </span>
            </div>
            <Slider
              min={0.5} max={2.0} step={0.1}
              value={[settings.speed]}
              onValueChange={([v]) => updateSettings("speed", v)}
              className="w-full"
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
                  className="w-full p-3 text-left text-sm bg-[#EFF6FF] hover:bg-[#F9FAFB] rounded-[10px] transition-colors"
                >
                  {template}
                </button>
              ))}
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="effects">
        <div className="rounded-[14px] border border-[#E5E7EB] bg-white shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
          {/* Voice Profiles */}
          <PanelHeading title="Voice Profiles" />
          <div className="p-4 border-b border-[#E5E7EB]">
            <p className="text-xs text-gray-500 mb-3">Quick presets for instant voice transformations</p>
            <div className="grid grid-cols-3 gap-2">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => applyProfile(profile.id)}
                  className={`p-2.5 rounded-[10px] border-2 text-center transition-all duration-200 ${settings.voiceProfile === profile.id
                      ? "border-[#2563EB] bg-[#2563EB]/10"
                      : "border-[#E5E7EB] hover:border-[#2563EB]/30"
                    }`}
                >
                  <span className="text-xl block mb-0.5">{profile.icon}</span>
                  <p className={`text-[10px] font-medium ${settings.voiceProfile === profile.id ? "text-[#2563EB]" : ""}`}>
                    {profile.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Pitch Control */}
          <PanelHeading title="Pitch Shift" />
          <div className="p-4 border-b border-[#E5E7EB]">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-gray-500 font-medium">Pitch</span>
              <span className="text-xs font-semibold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">
                {settings.pitch > 0 ? "+" : ""}{settings.pitch} semitones
              </span>
            </div>
            <Slider
              min={-12} max={12} step={1}
              value={[settings.pitch]}
              onValueChange={([v]) => {
                updateSettings("pitch", v);
                updateSettings("voiceProfile", "custom");
              }}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>-12 (Lower)</span><span>0</span><span>+12 (Higher)</span>
            </div>
          </div>

          {/* Reverb Control */}
          <PanelHeading title="Reverb" />
          <div className="p-4 border-b border-[#E5E7EB]">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-gray-500 font-medium">Reverb Amount</span>
              <span className="text-xs font-semibold text-[#4B5563] bg-[#F3F4F6] px-2 py-0.5 rounded-full">
                {Math.round(settings.reverb * 100)}%
              </span>
            </div>
            <Slider
              min={0} max={1} step={0.05}
              value={[settings.reverb]}
              onValueChange={([v]) => {
                updateSettings("reverb", v);
                updateSettings("voiceProfile", "custom");
              }}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>Dry</span><span>50%</span><span>Wet</span>
            </div>
          </div>

          {/* Current Profile Info */}
          <PanelHeading title="Current Settings" />
          <div className="p-4">
            <div className="p-4 bg-[#F9FAFB] rounded-[14px] space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#4B5563]">Profile</span>
                <span className="font-medium capitalize">{settings.voiceProfile}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#4B5563]">Pitch</span>
                <span className="font-medium">{settings.pitch > 0 ? "+" : ""}{settings.pitch} st</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#4B5563]">Reverb</span>
                <span className="font-medium">{Math.round(settings.reverb * 100)}%</span>
              </div>
              {settings.voice2 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#4B5563]">Blending</span>
                  <span className="font-medium">{Math.round(settings.blendRatio * 100)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="info">
        <div className="rounded-[14px] border border-[#E5E7EB] bg-white shadow-sm lg:h-[calc(100vh-150px)] lg:overflow-y-scroll scrollbar-hide animate-fade-in">
          {/* Device Info */}
          <PanelHeading title="Device Info" />
          <div className="p-4 border-b border-[#E5E7EB]">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#4B5563]">GPU Acceleration</span>
                <span className={`text-sm font-medium px-3 py-1 rounded-full flex items-center gap-1 ${deviceInfo.hasWebGPU ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                  {deviceInfo.hasWebGPU && <BsCheckCircle className="text-xs" />}
                  {deviceInfo.hasWebGPU ? "WebGPU" : "CPU (WASM)"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#4B5563]">CPU Cores</span>
                <span className="text-sm font-medium">{deviceInfo.cores}</span>
              </div>
              {deviceInfo.memory && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#4B5563]">Memory</span>
                  <span className="text-sm font-medium">{deviceInfo.memory} GB</span>
                </div>
              )}
            </div>
          </div>

          {/* About */}
          <PanelHeading title="About Kokoro TTS" />
          <div className="p-4 border-b border-[#E5E7EB]">
            <div className="p-4 bg-[#F9FAFB] rounded-[14px]">
              <ul className="text-sm text-[#4B5563] space-y-1">
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
          <div className="p-4 border-b border-[#E5E7EB]">
            <div className="space-y-2 text-sm">
              {Object.entries(langNames).map(([code, name]) => (
                <div key={code} className="flex items-center justify-between p-2 bg-[#F9FAFB] rounded-[10px]">
                  <span>{name}</span>
                  <span className="text-xs text-[#4B5563] bg-[#E5E7EB] px-2 py-0.5 rounded-full">
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
                <span className="text-sm text-[#4B5563]">Characters</span>
                <span className="text-sm font-medium">{text.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#4B5563]">Voice</span>
                <span className="text-sm font-medium">{voices.find(v => v.id === settings.voice)?.name || settings.voice}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#4B5563]">Profile</span>
                <span className="text-sm font-medium capitalize">{settings.voiceProfile}</span>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
      </Tabs>
    </section>
  );
};

export default TTSControlPanel;
