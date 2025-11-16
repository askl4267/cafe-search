export type AreaBase = {
  code: string;
  name: string;
};

export type MidArea = AreaBase;
export type SmallArea = AreaBase;

export type MidAreaDisplay = MidArea & {
  count?: number;
  selected?: boolean;
};

export type SmallAreaDisplay = SmallArea & {
  count?: number;
  checked?: boolean;
};

export type Cafe = {
  id: string;
  name: string;
  description: string;
  address: string;
  parking: string;
  wifi: string;
  nonSmoking: string;
  image: string;
};
