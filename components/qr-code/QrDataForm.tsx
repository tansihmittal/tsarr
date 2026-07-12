import { QrTypeDef } from "./qrTypes";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface Props {
  typeDef: QrTypeDef;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

const QrDataForm: React.FC<Props> = ({ typeDef, values, onChange }) => {
  return (
    <div className="flex flex-col gap-3">
      {typeDef.fields.map((field) => {
        const value = values[field.key] ?? field.defaultValue ?? "";

        if (field.type === "checkbox") {
          return (
            <label key={field.key} className="flex items-center justify-between py-1">
              <span className="text-sm text-[#4B5563] dark:text-gray-400">{field.label}</span>
              <Switch checked={value === "true"} onCheckedChange={(c) => onChange(field.key, c ? "true" : "false")} />
            </label>
          );
        }

        if (field.type === "select") {
          return (
            <div key={field.key} className="flex flex-col gap-1.5">
              <Label className="text-xs text-[#4B5563] dark:text-gray-400">{field.label}</Label>
              <Select value={value || field.defaultValue} onValueChange={(v) => onChange(field.key, v)}>
                <SelectTrigger className="w-full text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }

        if (field.type === "textarea") {
          return (
            <div key={field.key} className="flex flex-col gap-1.5">
              <Label className="text-xs text-[#4B5563] dark:text-gray-400">{field.label}</Label>
              <Textarea
                rows={3}
                className="text-sm resize-none"
                placeholder={field.placeholder}
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            </div>
          );
        }

        return (
          <div key={field.key} className="flex flex-col gap-1.5">
            <Label className="text-xs text-[#4B5563] dark:text-gray-400">{field.label}</Label>
            <Input
              type={field.type === "datetime" ? "datetime-local" : field.type}
              className="text-sm"
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => onChange(field.key, e.target.value)}
            />
          </div>
        );
      })}
    </div>
  );
};

export default QrDataForm;
