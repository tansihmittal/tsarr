import {
  BsFonts,
  BsChatDots,
  BsWifi,
  BsPersonVcard,
  BsCalendarEvent,
  BsLink45Deg,
  BsEnvelope,
  BsPhone,
  BsApp,
  BsFileEarmark,
  BsWhatsapp,
  BsCurrencyBitcoin,
  BsCashCoin,
} from "react-icons/bs";
import { qrTypes } from "./qrTypes";

const ICONS: Record<string, any> = {
  text: BsFonts,
  sms: BsChatDots,
  wifi: BsWifi,
  vcard: BsPersonVcard,
  event: BsCalendarEvent,
  link: BsLink45Deg,
  email: BsEnvelope,
  phone: BsPhone,
  app: BsApp,
  file: BsFileEarmark,
  whatsapp: BsWhatsapp,
  crypto: BsCurrencyBitcoin,
  upi: BsCashCoin,
};

interface Props {
  activeId: string;
  onSelect: (id: string) => void;
}

const QrTypeSelector: React.FC<Props> = ({ activeId, onSelect }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {qrTypes.map((t) => {
        const Icon = ICONS[t.id] || BsFonts;
        const active = activeId === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            title={t.describe({})}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-[12px] border text-sm font-medium transition-all ${
              active
                ? "border-[#2563EB] text-[#2563EB] bg-[#2563EB]/5 ring-1 ring-[#2563EB]"
                : "border-[#E5E7EB] dark:border-gray-700 text-[#374151] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <Icon className="text-base" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
};

export default QrTypeSelector;
