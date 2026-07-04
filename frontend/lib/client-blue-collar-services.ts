export type BlueCollarServiceOption = {
  label: string;
  value: string;
};

export const BLUE_COLLAR_SERVICES: BlueCollarServiceOption[] = [
  { value: "plumber", label: "Plumber" },
  { value: "electrician", label: "Electrician" },
  { value: "carpenter", label: "Carpenter" },
  { value: "hvac_technician", label: "HVAC Technician" },
  { value: "painter", label: "Painter" },
  { value: "roofer", label: "Roofer" },
  { value: "mason", label: "Mason" },
  { value: "landscaper", label: "Landscaper" },
  { value: "general_contractor", label: "General Contractor" },
];

export function getBlueCollarServiceLabel(value: string): string {
  return (
    BLUE_COLLAR_SERVICES.find((option) => option.value === value)?.label ?? value
  );
}
