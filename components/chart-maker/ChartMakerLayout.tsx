import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import Navigation from "../common/Navigation";
import BackgroundPicker, { BackgroundConfig } from "../common/BackgroundPicker";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Pie, Doughnut, Radar, PolarArea, Scatter, Bubble } from "react-chartjs-2";
import {
  BsDownload,
  BsClipboard,
  BsPlus,
  BsTrash,
  BsUpload,
  BsTable,
  BsBookmark,
  BsBookmarkFill,
} from "react-icons/bs";
import { TfiExport } from "react-icons/tfi";
import { BiReset } from "react-icons/bi";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler
);

type ChartType = "line" | "bar" | "pie" | "doughnut" | "radar" | "polarArea" | "horizontalBar" | "area" | "stackedBar" | "stackedArea" | "scatter" | "bubble" | "stepLine" | "combo" | "heatmap" | "treemap" | "boxplot" | "radialBar" | "gauge" | "solidGauge";

interface DataSet {
  name: string;
  data: number[];
  color: string;
  borderColor: string;
}

interface ChartPreset {
  id: string;
  name: string;
  chartType: ChartType;
  labels: string[];
  datasets: DataSet[];
  isCustom?: boolean;
}

const defaultColors = [
  "#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#8b5cf6",
  "#ef4444", "#22c55e", "#3b82f6", "#f97316", "#06b6d4",
];

const chartTypes: { id: ChartType; name: string; icon: string }[] = [
  // Basic Charts
  { id: "bar", name: "Bar", icon: "📊" },
  { id: "horizontalBar", name: "Column", icon: "📊" },
  { id: "line", name: "Line", icon: "📈" },
  { id: "area", name: "Area", icon: "📉" },
  // Circular Charts
  { id: "pie", name: "Pie", icon: "🥧" },
  { id: "doughnut", name: "Donut", icon: "🍩" },
  { id: "polarArea", name: "Polar", icon: "🎯" },
  { id: "radar", name: "Radar", icon: "🕸️" },
  // Stacked Charts
  { id: "stackedBar", name: "Stacked", icon: "📚" },
  { id: "stackedArea", name: "S-Area", icon: "🏔️" },
  // Advanced Charts
  { id: "scatter", name: "Scatter", icon: "⚬" },
  { id: "bubble", name: "Bubble", icon: "🫧" },
  { id: "stepLine", name: "Step", icon: "📶" },
  { id: "combo", name: "Combo", icon: "📊📈" },
  // New Chart Types
  { id: "heatmap", name: "Heatmap", icon: "🔥" },
  { id: "treemap", name: "Treemap", icon: "🌳" },
  { id: "boxplot", name: "BoxPlot", icon: "📦" },
  { id: "radialBar", name: "RadialBar", icon: "🎡" },
  { id: "gauge", name: "Gauge", icon: "⏱️" },
  { id: "solidGauge", name: "SolidGauge", icon: "🔘" },
];

const defaultPresets: ChartPreset[] = [
  { id: "sales", name: "Monthly Sales", chartType: "bar", labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], datasets: [{ name: "Revenue", data: [65, 59, 80, 81, 56, 95], color: "#6366f1", borderColor: "#4f46e5" }] },
  { id: "comparison", name: "Year Comparison", chartType: "line", labels: ["Q1", "Q2", "Q3", "Q4"], datasets: [{ name: "2023", data: [45, 60, 75, 90], color: "#6366f1", borderColor: "#4f46e5" }, { name: "2024", data: [55, 70, 85, 100], color: "#ec4899", borderColor: "#db2777" }] },
  { id: "market", name: "Market Share", chartType: "pie", labels: ["Product A", "Product B", "Product C", "Others"], datasets: [{ name: "Share", data: [35, 25, 25, 15], color: "#14b8a6", borderColor: "#0d9488" }] },
  { id: "survey", name: "Survey Results", chartType: "doughnut", labels: ["Excellent", "Good", "Average", "Poor"], datasets: [{ name: "Responses", data: [45, 30, 15, 10], color: "#f59e0b", borderColor: "#d97706" }] },
  { id: "performance", name: "Performance Metrics", chartType: "radar", labels: ["Speed", "Quality", "Cost", "Support", "Features"], datasets: [{ name: "Product", data: [85, 90, 70, 80, 95], color: "#8b5cf6", borderColor: "#7c3aed" }] },
  { id: "traffic", name: "Website Traffic", chartType: "area", labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], datasets: [{ name: "Visitors", data: [1200, 1900, 1500, 2100, 1800, 900, 700], color: "#22c55e", borderColor: "#16a34a" }] },
  { id: "budget", name: "Budget Allocation", chartType: "polarArea", labels: ["Marketing", "Development", "Operations", "HR", "R&D"], datasets: [{ name: "Budget", data: [30, 25, 20, 15, 10], color: "#3b82f6", borderColor: "#2563eb" }] },
  { id: "growth", name: "Growth Trend", chartType: "line", labels: ["2019", "2020", "2021", "2022", "2023", "2024"], datasets: [{ name: "Users (K)", data: [10, 25, 45, 80, 120, 180], color: "#f97316", borderColor: "#ea580c" }] },
  { id: "expenses", name: "Monthly Expenses", chartType: "horizontalBar", labels: ["Rent", "Utilities", "Salaries", "Marketing", "Other"], datasets: [{ name: "Amount ($K)", data: [15, 5, 45, 20, 10], color: "#ef4444", borderColor: "#dc2626" }] },
  { id: "ratings", name: "Product Ratings", chartType: "bar", labels: ["Design", "Performance", "Value", "Support", "Features"], datasets: [{ name: "Score", data: [4.5, 4.2, 3.8, 4.0, 4.3], color: "#06b6d4", borderColor: "#0891b2" }] },
  // New chart type presets
  { id: "stacked-revenue", name: "Revenue by Region", chartType: "stackedBar", labels: ["Q1", "Q2", "Q3", "Q4"], datasets: [{ name: "North", data: [40, 55, 60, 70], color: "#6366f1", borderColor: "#4f46e5" }, { name: "South", data: [30, 40, 45, 50], color: "#ec4899", borderColor: "#db2777" }, { name: "East", data: [25, 35, 40, 45], color: "#14b8a6", borderColor: "#0d9488" }] },
  { id: "stacked-traffic", name: "Traffic Sources", chartType: "stackedArea", labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], datasets: [{ name: "Organic", data: [400, 500, 600, 700, 800, 900], color: "#22c55e", borderColor: "#16a34a" }, { name: "Paid", data: [200, 300, 350, 400, 450, 500], color: "#3b82f6", borderColor: "#2563eb" }, { name: "Social", data: [100, 150, 200, 250, 300, 350], color: "#f59e0b", borderColor: "#d97706" }] },
  { id: "scatter-correlation", name: "Price vs Sales", chartType: "scatter", labels: ["1", "2", "3", "4", "5", "6"], datasets: [{ name: "Products", data: [25, 45, 35, 60, 50, 70], color: "#8b5cf6", borderColor: "#7c3aed" }] },
  { id: "bubble-market", name: "Market Analysis", chartType: "bubble", labels: ["A", "B", "C", "D", "E"], datasets: [{ name: "Companies", data: [30, 45, 25, 35, 50], color: "#ef4444", borderColor: "#dc2626" }] },
  { id: "step-inventory", name: "Inventory Levels", chartType: "stepLine", labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"], datasets: [{ name: "Stock", data: [100, 100, 80, 80, 120, 120], color: "#06b6d4", borderColor: "#0891b2" }] },
  { id: "combo-sales", name: "Sales & Growth", chartType: "combo", labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], datasets: [{ name: "Revenue ($K)", data: [65, 75, 85, 90, 100, 115], color: "#6366f1", borderColor: "#4f46e5" }, { name: "Growth %", data: [5, 15, 13, 6, 11, 15], color: "#22c55e", borderColor: "#16a34a" }] },
  // New chart type presets
  { id: "heatmap-activity", name: "Activity Heatmap", chartType: "heatmap", labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], datasets: [{ name: "Week 1", data: [30, 45, 60, 75, 50, 20, 15], color: "#ef4444", borderColor: "#dc2626" }, { name: "Week 2", data: [40, 55, 70, 65, 45, 25, 10], color: "#f97316", borderColor: "#ea580c" }, { name: "Week 3", data: [35, 50, 80, 70, 55, 30, 20], color: "#eab308", borderColor: "#ca8a04" }] },
  { id: "treemap-budget", name: "Budget Breakdown", chartType: "treemap", labels: ["Marketing", "Development", "Operations", "HR", "R&D"], datasets: [{ name: "Budget", data: [35, 30, 20, 10, 5], color: "#8b5cf6", borderColor: "#7c3aed" }] },
  { id: "boxplot-scores", name: "Test Scores", chartType: "boxplot", labels: ["Math", "Science", "English", "History", "Art"], datasets: [{ name: "Scores", data: [75, 82, 68, 71, 88], color: "#06b6d4", borderColor: "#0891b2" }] },
  { id: "radialbar-progress", name: "Project Progress", chartType: "radialBar", labels: ["Design", "Development", "Testing", "Deployment"], datasets: [{ name: "Progress", data: [85, 70, 45, 20], color: "#22c55e", borderColor: "#16a34a" }] },
  { id: "gauge-performance", name: "Performance Score", chartType: "gauge", labels: ["Score"], datasets: [{ name: "Performance", data: [72], color: "#6366f1", borderColor: "#4f46e5" }] },
  { id: "solidgauge-cpu", name: "CPU Usage", chartType: "solidGauge", labels: ["CPU"], datasets: [{ name: "Usage", data: [65], color: "#ef4444", borderColor: "#dc2626" }] },
];


const STORAGE_KEY = "chart-maker-presets";

// Custom Heatmap Chart Component
const HeatmapChart: React.FC<{ data: any; options: any; datasets: DataSet[]; labels: string[] }> = ({ datasets, labels }) => {
  const getHeatColor = (value: number, max: number) => {
    const intensity = value / max;
    if (intensity < 0.25) return "#22c55e";
    if (intensity < 0.5) return "#eab308";
    if (intensity < 0.75) return "#f97316";
    return "#ef4444";
  };

  const allValues = datasets.flatMap(ds => ds.data);
  const maxValue = Math.max(...allValues);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <div className="grid gap-1" style={{ gridTemplateColumns: `auto repeat(${labels.length}, 1fr)` }}>
        <div></div>
        {labels.map((label, i) => (
          <div key={i} className="text-xs text-center font-medium text-gray-600 px-2">{label}</div>
        ))}
        {datasets.map((ds, dsIndex) => (
          <>
            <div key={`label-${dsIndex}`} className="text-xs font-medium text-gray-600 pr-2 flex items-center">{ds.name}</div>
            {ds.data.map((value, i) => (
              <div
                key={`${dsIndex}-${i}`}
                className="w-12 h-10 rounded flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: getHeatColor(value, maxValue) }}
                title={`${value}`}
              >
                {value}
              </div>
            ))}
          </>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
        <span>Low</span>
        <div className="flex gap-0.5">
          <div className="w-6 h-3 bg-green-500 rounded-l"></div>
          <div className="w-6 h-3 bg-yellow-500"></div>
          <div className="w-6 h-3 bg-orange-500"></div>
          <div className="w-6 h-3 bg-red-500 rounded-r"></div>
        </div>
        <span>High</span>
      </div>
    </div>
  );
};

// Custom Treemap Chart Component
const TreemapChart: React.FC<{ datasets: DataSet[]; labels: string[] }> = ({ datasets, labels }) => {
  const data = datasets[0]?.data || [];
  const colors = ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#8b5cf6", "#ef4444", "#22c55e", "#3b82f6"];
  const total = data.reduce((a, b) => a + b, 0);

  return (
    <div className="w-full h-full flex flex-wrap gap-1 p-4">
      {labels.map((label, i) => {
        const percentage = (data[i] / total) * 100;
        return (
          <div
            key={i}
            className="rounded-lg flex items-center justify-center text-white font-bold text-sm p-2"
            style={{
              backgroundColor: colors[i % colors.length],
              flexBasis: `${Math.max(percentage * 2, 15)}%`,
              flexGrow: percentage / 10,
              minHeight: "60px",
            }}
          >
            <div className="text-center">
              <div>{label}</div>
              <div className="text-xs opacity-80">{data[i]} ({percentage.toFixed(1)}%)</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Custom BoxPlot Chart Component
const BoxPlotChart: React.FC<{ datasets: DataSet[]; labels: string[]; labelColor: string; gridColor: string }> = ({ datasets, labels, labelColor, gridColor }) => {
  const data = datasets[0]?.data || [];
  const maxValue = Math.max(...data);
  const color = datasets[0]?.color || "#6366f1";

  return (
    <div className="w-full h-full flex flex-col p-4">
      <div className="flex-1 flex items-end gap-4 pb-8 border-b" style={{ borderColor: gridColor }}>
        {labels.map((label, i) => {
          const value = data[i];
          const height = (value / maxValue) * 100;
          const q1 = value * 0.6;
          const q3 = value * 0.9;
          const median = value * 0.75;
          
          return (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div className="relative w-full flex flex-col items-center" style={{ height: `${height}%`, minHeight: "40px" }}>
                {/* Whisker top */}
                <div className="w-px bg-gray-400" style={{ height: "10%" }}></div>
                <div className="w-8 h-px bg-gray-400"></div>
                {/* Box */}
                <div 
                  className="w-12 rounded border-2 flex items-center justify-center relative"
                  style={{ 
                    backgroundColor: color + "40", 
                    borderColor: color,
                    height: "60%",
                  }}
                >
                  {/* Median line */}
                  <div className="absolute w-full h-0.5" style={{ backgroundColor: color, top: "50%" }}></div>
                </div>
                {/* Whisker bottom */}
                <div className="w-8 h-px bg-gray-400"></div>
                <div className="w-px bg-gray-400" style={{ height: "10%" }}></div>
              </div>
              <div className="text-xs mt-2 font-medium" style={{ color: labelColor }}>{label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Custom RadialBar Chart Component
const RadialBarChart: React.FC<{ datasets: DataSet[]; labels: string[] }> = ({ datasets, labels }) => {
  const data = datasets[0]?.data || [];
  const colors = ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#8b5cf6"];

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="relative w-64 h-64">
        {labels.map((label, i) => {
          const value = data[i] || 0;
          const radius = 100 - i * 20;
          const circumference = 2 * Math.PI * radius;
          const strokeDasharray = `${(value / 100) * circumference} ${circumference}`;
          
          return (
            <svg key={i} className="absolute inset-0" viewBox="0 0 220 220">
              {/* Background circle */}
              <circle
                cx="110"
                cy="110"
                r={radius}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="16"
              />
              {/* Progress circle */}
              <circle
                cx="110"
                cy="110"
                r={radius}
                fill="none"
                stroke={colors[i % colors.length]}
                strokeWidth="16"
                strokeDasharray={strokeDasharray}
                strokeLinecap="round"
                transform="rotate(-90 110 110)"
              />
            </svg>
          );
        })}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold">{data[0]}%</div>
            <div className="text-xs text-gray-500">{labels[0]}</div>
          </div>
        </div>
      </div>
      <div className="ml-4 space-y-2">
        {labels.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i % colors.length] }}></div>
            <span className="text-sm">{label}: {data[i]}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Custom Gauge Chart Component
const GaugeChart: React.FC<{ datasets: DataSet[]; title: string }> = ({ datasets, title }) => {
  const value = datasets[0]?.data[0] || 0;
  const color = datasets[0]?.color || "#6366f1";
  const angle = (value / 100) * 180 - 90;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <svg viewBox="0 0 200 120" className="w-64 h-40">
        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="20"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="20"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * 251.2} 251.2`}
        />
        {/* Needle */}
        <line
          x1="100"
          y1="100"
          x2={100 + 60 * Math.cos((angle * Math.PI) / 180)}
          y2={100 + 60 * Math.sin((angle * Math.PI) / 180)}
          stroke="#374151"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="100" cy="100" r="8" fill="#374151" />
        {/* Labels */}
        <text x="20" y="115" className="text-xs" fill="#6b7280">0</text>
        <text x="175" y="115" className="text-xs" fill="#6b7280">100</text>
      </svg>
      <div className="text-center mt-2">
        <div className="text-3xl font-bold" style={{ color }}>{value}</div>
        <div className="text-sm text-gray-500">{title}</div>
      </div>
    </div>
  );
};

// Custom SolidGauge Chart Component
const SolidGaugeChart: React.FC<{ datasets: DataSet[]; title: string }> = ({ datasets, title }) => {
  const value = datasets[0]?.data[0] || 0;
  const color = datasets[0]?.color || "#6366f1";
  const circumference = 2 * Math.PI * 80;
  const strokeDasharray = `${(value / 100) * circumference * 0.75} ${circumference}`;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        {/* Background arc */}
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="24"
          strokeDasharray={`${circumference * 0.75} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(135 100 100)"
        />
        {/* Value arc */}
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke={color}
          strokeWidth="24"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          transform="rotate(135 100 100)"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <div className="text-4xl font-bold" style={{ color }}>{value}%</div>
        <div className="text-sm text-gray-500">{title}</div>
      </div>
    </div>
  );
};

const ChartMakerLayout: React.FC = () => {
  const chartRef = useRef<ChartJS>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [chartType, setChartType] = useState<ChartType>("bar");
  const [title, setTitle] = useState("My Chart");
  const [labels, setLabels] = useState<string[]>(["Jan", "Feb", "Mar", "Apr", "May", "Jun"]);
  const [datasets, setDatasets] = useState<DataSet[]>([
    { name: "Series 1", data: [65, 59, 80, 81, 56, 95], color: "#6366f1", borderColor: "#4f46e5" },
  ]);
  const [showLegend, setShowLegend] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [animated, setAnimated] = useState(true);
  const [padding, setPadding] = useState(40);
  const [borderRadius, setBorderRadius] = useState(16);
  const [activeTab, setActiveTab] = useState<"data" | "style" | "presets">("data");
  const [customPresets, setCustomPresets] = useState<ChartPreset[]>([]);
  const [newPresetName, setNewPresetName] = useState("");
  
  // New style options
  const [gridColor, setGridColor] = useState("#e5e7eb");
  const [titleColor, setTitleColor] = useState("#1f2937");
  const [labelColor, setLabelColor] = useState("#6b7280");
  const [legendColor, setLegendColor] = useState("#374151");
  const [isExportingGif, setIsExportingGif] = useState(false);

  const [background, setBackground] = useState<BackgroundConfig>({
    type: "solid",
    background: "#ffffff",
    color1: "#ffffff",
    color2: "#ffffff",
    direction: "to bottom right",
  });

  // Load custom presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setCustomPresets(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Save custom presets to localStorage
  const saveCustomPresets = (presets: ChartPreset[]) => {
    setCustomPresets(presets);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  };

  // Parse Excel/CSV data
  const parseExcelData = useCallback((text: string) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      toast.error("Need at least 2 rows (header + data)");
      return;
    }
    const headers = lines[0].split(/[,\t]/).map((h) => h.trim());
    const newLabels = headers.slice(1);
    const newDatasets: DataSet[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(/[,\t]/).map((c) => c.trim());
      const name = cells[0] || `Series ${i}`;
      const data = cells.slice(1).map((v) => parseFloat(v) || 0);
      const color = defaultColors[(i - 1) % defaultColors.length];
      newDatasets.push({ name, data, color, borderColor: color });
    }
    setLabels(newLabels);
    setDatasets(newDatasets);
    toast.success("Data imported!");
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => parseExcelData(event.target?.result as string);
    reader.readAsText(file);
  }, [parseExcelData]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text");
      if (text && (text.includes("\t") || text.includes(","))) {
        e.preventDefault();
        parseExcelData(text);
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [parseExcelData]);

  const updateLabel = (index: number, value: string) => {
    const l = [...labels];
    l[index] = value;
    setLabels(l);
  };

  const addLabel = () => {
    setLabels([...labels, `Item ${labels.length + 1}`]);
    setDatasets(datasets.map((ds) => ({ ...ds, data: [...ds.data, 50] })));
  };

  const removeLabel = (index: number) => {
    if (labels.length <= 1) return;
    setLabels(labels.filter((_, i) => i !== index));
    setDatasets(datasets.map((ds) => ({ ...ds, data: ds.data.filter((_, i) => i !== index) })));
  };

  const addDataset = () => {
    const color = defaultColors[datasets.length % defaultColors.length];
    setDatasets([...datasets, { name: `Series ${datasets.length + 1}`, data: labels.map(() => 50), color, borderColor: color }]);
  };

  const removeDataset = (index: number) => {
    if (datasets.length <= 1) return;
    setDatasets(datasets.filter((_, i) => i !== index));
  };

  const updateDataset = (dsIndex: number, field: keyof DataSet, value: string) => {
    const updated = [...datasets];
    updated[dsIndex] = { ...updated[dsIndex], [field]: value };
    setDatasets(updated);
  };

  const updateDataValue = (dsIndex: number, labelIndex: number, value: number) => {
    const updated = [...datasets];
    updated[dsIndex].data[labelIndex] = value;
    setDatasets(updated);
  };

  const loadPreset = (preset: ChartPreset) => {
    setChartType(preset.chartType);
    setLabels([...preset.labels]);
    setDatasets(preset.datasets.map(ds => ({ ...ds })));
    setTitle(preset.name);
    toast.success(`Loaded "${preset.name}"`);
  };

  const saveAsPreset = () => {
    if (!newPresetName.trim()) {
      toast.error("Enter a preset name");
      return;
    }
    const preset: ChartPreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      chartType,
      labels: [...labels],
      datasets: datasets.map(ds => ({ ...ds, data: [...ds.data] })),
      isCustom: true,
    };
    saveCustomPresets([...customPresets, preset]);
    setNewPresetName("");
    toast.success("Preset saved!");
  };

  const deleteCustomPreset = (id: string) => {
    saveCustomPresets(customPresets.filter(p => p.id !== id));
    toast.success("Preset deleted");
  };

  const resetAll = () => {
    if (!confirm("Reset all changes?")) return;
    setChartType("bar");
    setTitle("My Chart");
    setLabels(["Jan", "Feb", "Mar", "Apr", "May", "Jun"]);
    setDatasets([{ name: "Series 1", data: [65, 59, 80, 81, 56, 95], color: "#6366f1", borderColor: "#4f46e5" }]);
    setBackground({ type: "solid", background: "#ffffff", color1: "#ffffff", color2: "#ffffff", direction: "to bottom right" });
    toast.success("Reset complete");
  };


  const chartData = {
    labels,
    datasets: datasets.map((ds, dsIndex) => {
      // For scatter/bubble charts, convert data to {x, y} format
      if (chartType === "scatter") {
        return {
          label: ds.name,
          data: ds.data.map((val, i) => ({ x: i, y: val })),
          backgroundColor: ds.color + "cc",
          borderColor: ds.borderColor,
          borderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
        };
      }
      if (chartType === "bubble") {
        return {
          label: ds.name,
          data: ds.data.map((val, i) => ({ 
            x: i + 1, 
            y: val, 
            r: Math.max(8, Math.min(40, val / 3)) // Better radius scaling
          })),
          backgroundColor: ds.color + "80",
          borderColor: ds.borderColor,
          borderWidth: 2,
          hoverRadius: 5,
        };
      }
      // For combo chart, alternate between bar and line
      if (chartType === "combo") {
        return {
          type: dsIndex % 2 === 0 ? "bar" as const : "line" as const,
          label: ds.name,
          data: ds.data,
          backgroundColor: dsIndex % 2 === 0 ? ds.color + "cc" : ds.color + "40",
          borderColor: ds.borderColor,
          borderWidth: 2,
          fill: dsIndex % 2 !== 0,
          tension: 0.4,
          borderRadius: dsIndex % 2 === 0 ? 6 : 0,
          pointBackgroundColor: ds.borderColor,
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: dsIndex % 2 !== 0 ? 4 : 0,
          yAxisID: dsIndex % 2 === 0 ? "y" : "y1",
        };
      }
      return {
        label: ds.name,
        data: ds.data,
        backgroundColor: ["line", "radar", "area", "stackedArea", "stepLine"].includes(chartType) ? ds.color + "40" : ds.color + "cc",
        borderColor: ds.borderColor,
        borderWidth: 2,
        fill: ["area", "stackedArea", "radar"].includes(chartType),
        tension: chartType === "stepLine" ? 0 : 0.4,
        stepped: chartType === "stepLine" ? "before" as const : false,
        borderRadius: ["bar", "horizontalBar", "stackedBar"].includes(chartType) ? 6 : 0,
        pointBackgroundColor: ds.borderColor,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        stack: ["stackedBar", "stackedArea"].includes(chartType) ? "stack1" : undefined,
      };
    }),
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: chartType === "horizontalBar" ? "y" as const : "x" as const,
    animation: animated ? { duration: 750 } : false as const,
    plugins: {
      legend: { 
        display: showLegend, 
        position: "top" as const, 
        labels: { 
          usePointStyle: true, 
          padding: 20,
          color: legendColor,
          font: { weight: 500 as const },
        } 
      },
      title: { 
        display: !!title, 
        text: title, 
        font: { size: 20, weight: "bold" as const }, 
        padding: { bottom: 20 },
        color: titleColor,
      },
    },
    scales: ["line", "bar", "horizontalBar", "area", "stackedBar", "stackedArea", "scatter", "bubble", "stepLine", "combo"].includes(chartType) ? {
      x: { 
        grid: { display: showGrid, color: gridColor }, 
        ticks: { padding: 10, color: labelColor },
        stacked: ["stackedBar", "stackedArea"].includes(chartType),
      },
      y: { 
        grid: { display: showGrid, color: gridColor }, 
        beginAtZero: true, 
        ticks: { padding: 10, color: labelColor },
        stacked: ["stackedBar", "stackedArea"].includes(chartType),
      },
      ...(chartType === "combo" ? {
        y1: {
          type: "linear" as const,
          display: true,
          position: "right" as const,
          grid: { drawOnChartArea: false },
          ticks: { color: labelColor },
        }
      } : {}),
    } : chartType === "radar" ? {
      r: {
        grid: { color: gridColor },
        angleLines: { color: gridColor },
        pointLabels: { color: labelColor },
        ticks: { color: labelColor, backdropColor: "transparent" },
      }
    } : undefined,
  };

  const handleExport = useCallback(async (format: "png" | "jpeg" | "svg", scale: number = 2) => {
    if (!chartContainerRef.current) return;
    
    const htmlToImage = await import("html-to-image");
    
    try {
      let dataUrl: string;
      if (format === "svg") {
        dataUrl = await htmlToImage.toSvg(chartContainerRef.current, { backgroundColor: background.type === "solid" ? background.color1 : "#ffffff" });
      } else if (format === "jpeg") {
        dataUrl = await htmlToImage.toJpeg(chartContainerRef.current, { pixelRatio: scale, backgroundColor: background.type === "solid" ? background.color1 : "#ffffff", quality: 0.95 });
      } else {
        dataUrl = await htmlToImage.toPng(chartContainerRef.current, { pixelRatio: scale, backgroundColor: background.type === "solid" ? background.color1 : undefined });
      }
      
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `tsarr-in-chart.${format}`;
      a.click();
      toast.success(`Exported as ${format.toUpperCase()}${format !== "svg" ? ` ${scale}x` : ""}`);
    } catch {
      toast.error("Export failed");
    }
  }, [background]);

  const handleCopyToClipboard = useCallback(async () => {
    if (!chartContainerRef.current) return;
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(chartContainerRef.current, { pixelRatio: 2 });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy");
    }
  }, []);

  // Export animated GIF/WebM
  const handleExportAnimated = useCallback(async () => {
    if (!chartContainerRef.current || !chartRef.current) return;

    setIsExportingGif(true);
    toast.loading("Recording animation...", { id: "gif-export" });

    try {
      // Get the chart's internal canvas
      const chartCanvas = chartRef.current.canvas;
      if (!chartCanvas) throw new Error("No chart canvas");

      // Create a new canvas for recording with background
      const recordCanvas = document.createElement("canvas");
      const container = chartContainerRef.current;
      recordCanvas.width = container.offsetWidth * 2;
      recordCanvas.height = container.offsetHeight * 2;
      const ctx = recordCanvas.getContext("2d");
      if (!ctx) throw new Error("No canvas context");

      // Check supported mime types
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "video/mp4";

      // Use MediaRecorder to capture
      const stream = recordCanvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5000000,
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tsarr-in-chart-animation.${mimeType.includes("mp4") ? "mp4" : "webm"}`;
        a.click();
        URL.revokeObjectURL(url);
        setIsExportingGif(false);
        toast.success("Animation exported!", { id: "gif-export" });
      };

      // Reset chart and prepare for animation
      chartRef.current.reset();

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms

      const duration = 2000; // 2 seconds
      const startTime = Date.now();
      let animationStarted = false;

      const drawFrame = () => {
        const elapsed = Date.now() - startTime;

        // Draw background
        if (background.type === "solid") {
          ctx.fillStyle = background.color1;
        } else if (background.type === "gradient") {
          const gradient = ctx.createLinearGradient(0, 0, recordCanvas.width, recordCanvas.height);
          gradient.addColorStop(0, background.color1);
          gradient.addColorStop(1, background.color2);
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = "#ffffff";
        }
        ctx.fillRect(0, 0, recordCanvas.width, recordCanvas.height);

        // Draw the chart canvas onto our recording canvas
        const chartCanvasEl = chartRef.current?.canvas;
        if (chartCanvasEl) {
          const scale = 2;
          const offsetX = (recordCanvas.width - chartCanvasEl.width * scale) / 2;
          const offsetY = (recordCanvas.height - chartCanvasEl.height * scale) / 2;
          ctx.drawImage(
            chartCanvasEl,
            offsetX,
            offsetY,
            chartCanvasEl.width * scale,
            chartCanvasEl.height * scale
          );
        }

        // Start animation after first frame
        if (!animationStarted) {
          animationStarted = true;
          chartRef.current?.update();
        }

        if (elapsed < duration) {
          requestAnimationFrame(drawFrame);
        } else {
          mediaRecorder.stop();
        }
      };

      // Start drawing frames
      requestAnimationFrame(drawFrame);
    } catch (error) {
      console.error("Animation export error:", error);
      toast.error("Failed to export animation", { id: "gif-export" });
      setIsExportingGif(false);
    }
  }, [background]);

  const renderChart = () => {
    const props = { ref: chartRef as React.RefObject<ChartJS<any>>, data: chartData, options: chartOptions };
    
    // Map chart types to actual Chart.js components
    switch (chartType) {
      case "line":
      case "area":
      case "stackedArea":
      case "stepLine":
        return <Line {...props as React.ComponentProps<typeof Line>} />;
      case "bar":
      case "horizontalBar":
      case "stackedBar":
        return <Bar {...props as React.ComponentProps<typeof Bar>} />;
      case "pie":
        return <Pie {...props as React.ComponentProps<typeof Pie>} />;
      case "doughnut":
        return <Doughnut {...props as React.ComponentProps<typeof Doughnut>} />;
      case "radar":
        return <Radar {...props as React.ComponentProps<typeof Radar>} />;
      case "polarArea":
        return <PolarArea {...props as React.ComponentProps<typeof PolarArea>} />;
      case "scatter":
        return <Scatter {...props as React.ComponentProps<typeof Scatter>} />;
      case "bubble":
        return <Bubble {...props as React.ComponentProps<typeof Bubble>} />;
      case "combo":
        // Combo chart uses Bar component with mixed dataset types
        return <Bar {...props as React.ComponentProps<typeof Bar>} />;
      case "heatmap":
        // Heatmap rendered as a custom grid using canvas-like approach with Bar
        return <HeatmapChart data={chartData} options={chartOptions} datasets={datasets} labels={labels} />;
      case "treemap":
        // Treemap rendered as custom component
        return <TreemapChart datasets={datasets} labels={labels} />;
      case "boxplot":
        // BoxPlot rendered as custom component
        return <BoxPlotChart datasets={datasets} labels={labels} labelColor={labelColor} gridColor={gridColor} />;
      case "radialBar":
        // RadialBar rendered as custom component
        return <RadialBarChart datasets={datasets} labels={labels} />;
      case "gauge":
        // Gauge rendered as custom component
        return <GaugeChart datasets={datasets} title={title} />;
      case "solidGauge":
        // SolidGauge rendered as custom component
        return <SolidGaugeChart datasets={datasets} title={title} />;
      default:
        return <Bar {...props as React.ComponentProps<typeof Bar>} />;
    }
  };

  const ToolbarButton = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
    <button onClick={onClick} className="flex items-center gap-2 px-4 py-2.5 bg-base-100 border border-base-200 rounded-lg transition-all hover:bg-base-200/50 hover:border-primary/20 hover:shadow-sm">
      <span className="text-lg">{icon}</span>
      <span className="font-medium text-primary-content">{label}</span>
    </button>
  );


  return (
    <main className="min-h-[100vh] h-fit editor-bg relative">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <Navigation />
      <section className="container mx-auto px-4 lg:px-0 relative">
        <div className="grid gap-5 lg:grid-cols-[3fr_1.5fr]">
          {/* Preview Area */}
          <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="grid grid-cols-2 gap-2 mb-3 lg:flex lg:flex-wrap lg:justify-end">
              <div className="dropdown">
                <label tabIndex={0}><ToolbarButton icon={<TfiExport />} label="Export" onClick={() => {}} /></label>
                <ul tabIndex={0} className="dropdown-content menu p-2 mt-1 bg-base-100 border-2 rounded-lg min-w-[180px] z-50">
                  <li><a onClick={() => handleExport("png", 1)}>PNG 1x</a></li>
                  <li><a onClick={() => handleExport("png", 2)}>PNG 2x</a></li>
                  <li><a onClick={() => handleExport("png", 4)}>PNG 4x</a></li>
                  <li><a onClick={() => handleExport("jpeg", 2)}>JPEG 2x</a></li>
                  <li><a onClick={() => handleExport("svg")}>SVG</a></li>
                  <li className="border-t border-base-200 mt-1 pt-1"><a onClick={handleExportAnimated} className={isExportingGif ? "opacity-50 pointer-events-none" : ""}>🎬 Animated WebM</a></li>
                </ul>
              </div>
              <ToolbarButton icon={<BsClipboard />} label="Copy to Clipboard" onClick={handleCopyToClipboard} />
              <ToolbarButton icon={<BiReset />} label="Reset" onClick={resetAll} />
            </div>

            {/* Chart Container */}
            <div className="relative flex-1 min-h-[500px] lg:min-h-[600px] flex items-center justify-center rounded-2xl bg-base-200/30 border border-base-200/80 overflow-hidden">
              <div ref={chartContainerRef} className="w-full h-full flex items-center justify-center" style={{ background: background.background, padding: `${padding}px`, borderRadius: `${borderRadius}px` }}>
                <div className="w-full h-full max-w-[800px] max-h-[500px]">{renderChart()}</div>
              </div>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="bg-base-100 rounded-2xl shadow-lg p-5 h-fit max-h-[85vh] overflow-y-auto">
            {/* Tabs */}
            <div className="grid grid-cols-3 bg-base-200 rounded-lg p-1 mb-5">
              {(["data", "style", "presets"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`py-2 px-3 text-sm font-medium rounded-md capitalize transition-all ${activeTab === tab ? "bg-base-100 shadow-sm" : "hover:bg-base-100/50"}`}>
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "data" && (
              <div className="space-y-5">
                {/* Chart Type */}
                <div>
                  <label className="text-sm font-medium text-primary-content/70 block mb-2">Chart Type</label>
                  <div className="grid grid-cols-4 gap-2">
                    {chartTypes.map((t) => (
                      <button key={t.id} onClick={() => setChartType(t.id)} className={`p-2 rounded-lg text-center transition-all ${chartType === t.id ? "bg-primary text-white ring-2 ring-primary ring-offset-2 ring-offset-base-100" : "bg-base-200 hover:bg-base-300 text-primary-content"}`}>
                        <div className="text-lg">{t.icon}</div>
                        <div className="text-[10px] font-semibold">{t.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="text-sm font-medium text-primary-content/70 block mb-2">Chart Title</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input input-bordered w-full" placeholder="Enter title" />
                </div>

                {/* Import Data */}
                <div>
                  <label className="text-sm font-medium text-primary-content/70 block mb-2">Import Data</label>
                  <div className="flex gap-2">
                    <input ref={fileInputRef} type="file" accept=".csv,.tsv,.txt" onChange={handleFileUpload} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="btn btn-sm btn-outline flex-1 gap-1"><BsUpload /> CSV</button>
                    <button onClick={() => toast("Paste from Excel (Ctrl+V)", { icon: "📋" })} className="btn btn-sm btn-outline flex-1 gap-1"><BsTable /> Paste</button>
                  </div>
                </div>

                {/* Labels */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-primary-content/70">Labels ({labels.length})</label>
                    <button onClick={addLabel} className="btn btn-xs btn-primary gap-1"><BsPlus /></button>
                  </div>
                  <div className="bg-base-200 rounded-lg p-2 max-h-[120px] overflow-y-auto">
                    <div className="grid grid-cols-3 gap-1">
                      {labels.map((label, i) => (
                        <div key={i} className="flex items-center bg-base-100 rounded px-1">
                          <input type="text" value={label} onChange={(e) => updateLabel(i, e.target.value)} className="input input-xs flex-1 bg-transparent border-0 p-1 min-w-0" />
                          <button onClick={() => removeLabel(i)} className="text-error/60 hover:text-error p-0.5"><BsTrash size={10} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Data Series */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-primary-content/70">Data Series ({datasets.length})</label>
                    <button onClick={addDataset} className="btn btn-xs btn-primary gap-1"><BsPlus /></button>
                  </div>
                  <div className="space-y-3">
                    {datasets.map((ds, dsIndex) => (
                      <div key={dsIndex} className="bg-base-200 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col gap-1">
                            <input type="color" value={ds.color} onChange={(e) => updateDataset(dsIndex, "color", e.target.value)} className="w-6 h-6 rounded cursor-pointer" title="Fill Color" />
                            <input type="color" value={ds.borderColor} onChange={(e) => updateDataset(dsIndex, "borderColor", e.target.value)} className="w-6 h-6 rounded cursor-pointer" title="Line/Border Color" />
                          </div>
                          <input type="text" value={ds.name} onChange={(e) => updateDataset(dsIndex, "name", e.target.value)} className="input input-sm input-bordered flex-1 min-w-0" placeholder="Series name" />
                          <button onClick={() => removeDataset(dsIndex)} className="btn btn-xs btn-ghost text-error"><BsTrash /></button>
                        </div>
                        <div className="grid grid-cols-6 gap-1">
                          {ds.data.map((val, i) => (
                            <input key={i} type="number" value={val} onChange={(e) => updateDataValue(dsIndex, i, Number(e.target.value))} className="input input-xs input-bordered text-center p-1" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "style" && (
              <div className="space-y-5">
                {/* Legend Preview - Show series with colors */}
                {datasets.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-primary-content/70 block mb-2">Data Series Legend</label>
                    <div className="bg-base-200 rounded-lg p-3 space-y-2">
                      {datasets.map((ds, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: ds.color, border: `2px solid ${ds.borderColor}` }} />
                          <span className="text-sm font-medium" style={{ color: legendColor }}>{ds.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-primary-content/70 block mb-2">Background</label>
                  <BackgroundPicker background={background} onBackgroundChange={setBackground} showTilt={false} />
                </div>

                {/* Colors Section */}
                <div>
                  <label className="text-sm font-medium text-primary-content/70 block mb-2">Colors</label>
                  <div className="space-y-3 bg-base-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-primary-content">Title Color</span>
                      <input type="color" value={titleColor} onChange={(e) => setTitleColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-primary-content">Label Color</span>
                      <input type="color" value={labelColor} onChange={(e) => setLabelColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-primary-content">Legend Color</span>
                      <input type="color" value={legendColor} onChange={(e) => setLegendColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-primary-content">Grid Color</span>
                      <input type="color" value={gridColor} onChange={(e) => setGridColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-primary-content/70 block mb-2">Padding: {padding}px</label>
                  <input type="range" min="0" max="100" value={padding} onChange={(e) => setPadding(Number(e.target.value))} className="range range-primary range-sm w-full" />
                </div>
                <div>
                  <label className="text-sm font-medium text-primary-content/70 block mb-2">Border Radius: {borderRadius}px</label>
                  <input type="range" min="0" max="50" value={borderRadius} onChange={(e) => setBorderRadius(Number(e.target.value))} className="range range-primary range-sm w-full" />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-primary-content/70 block">Options</label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={showLegend} onChange={(e) => setShowLegend(e.target.checked)} className="checkbox checkbox-primary checkbox-sm" />
                    <span className="text-sm text-primary-content">Show Legend</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="checkbox checkbox-primary checkbox-sm" />
                    <span className="text-sm text-primary-content">Show Grid Lines</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={animated} onChange={(e) => setAnimated(e.target.checked)} className="checkbox checkbox-primary checkbox-sm" />
                    <span className="text-sm text-primary-content">Enable Animations</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === "presets" && (
              <div className="space-y-5">
                {/* Save Current as Preset */}
                <div>
                  <label className="text-sm font-medium text-primary-content/70 block mb-2">Save Current Chart</label>
                  <div className="flex gap-2">
                    <input type="text" value={newPresetName} onChange={(e) => setNewPresetName(e.target.value)} className="input input-sm input-bordered flex-1" placeholder="Preset name" />
                    <button onClick={saveAsPreset} className="btn btn-sm btn-primary gap-1"><BsBookmark /> Save</button>
                  </div>
                </div>

                {/* Custom Presets */}
                {customPresets.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-primary-content/70 block mb-2">Your Presets</label>
                    <div className="grid grid-cols-2 gap-2">
                      {customPresets.map((p) => (
                        <div key={p.id} className="relative group">
                          <button onClick={() => loadPreset(p)} className="btn btn-sm btn-outline w-full justify-start gap-1 pr-8">
                            <BsBookmarkFill className="text-primary" /> {p.name}
                          </button>
                          <button onClick={() => deleteCustomPreset(p.id)} className="absolute right-1 top-1/2 -translate-y-1/2 btn btn-xs btn-ghost text-error opacity-0 group-hover:opacity-100"><BsTrash /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Default Presets */}
                <div>
                  <label className="text-sm font-medium text-primary-content/70 block mb-2">Templates</label>
                  <div className="grid grid-cols-2 gap-2">
                    {defaultPresets.map((p) => (
                      <button key={p.id} onClick={() => loadPreset(p)} className="btn btn-sm btn-outline justify-start gap-1">
                        {chartTypes.find(t => t.id === p.chartType)?.icon} {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default ChartMakerLayout;
