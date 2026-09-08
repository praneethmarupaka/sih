export type Category =
  | 'Food & Beverages'
  | 'Electronics'
  | 'Cosmetics & Personal Care'
  | 'Household & Cleaning Products'
  | 'Toys & Stationery';

export type UserRole = 'Inspector' | 'Manufacturer' | 'Consumer' | 'Admin';

export type FieldStatus = 'compliant' | 'violation' | 'warning' | 'manual_review' | 'optional_qr';

export interface FieldRule {
  key: string;
  label: string;
  required: boolean;
  notes?: string;
  suggestionIfMissing: string;
  mustContainPhrase?: string;
  ruleReference?: string;
}

export interface CategoryRuleConfig {
  category: Category;
  description: string;
  getRules: (isImported: boolean) => FieldRule[];
}

export const CATEGORY_RULES: Record<Category, CategoryRuleConfig> = {
  'Food & Beverages': {
    category: 'Food & Beverages',
    description: 'Packaged Food & Beverages (Legal Metrology & FSSAI)',
    getRules: () => [
      {
        key: 'manufacturerName',
        label: 'Manufacturer Name',
        required: true,
        suggestionIfMissing: "Add manufacturer name prefixed with 'Mfg by' or 'Manufactured by' along with complete entity name."
      },
      {
        key: 'mrp',
        label: 'Maximum Retail Price (MRP)',
        required: true,
        mustContainPhrase: 'inclusive of all taxes',
        ruleReference: 'Rule 6(1)(f)',
        suggestionIfMissing: "Add MRP with the phrase 'inclusive of all taxes' or 'incl. of all taxes' in ₹."
      },
      {
        key: 'netQuantity',
        label: 'Net Quantity / Net Weight',
        required: true,
        suggestionIfMissing: "Declare net quantity or net weight using standard metric units (e.g., g, kg, ml, L) in compliant font height."
      },
      {
        key: 'mfgDate',
        label: 'Date of Manufacture / Packaging',
        required: true,
        suggestionIfMissing: "Mention Mfg Date or Pkd Date with Month and Year (e.g., 'Mfg Date: 08/2026' or 'Best Before')."
      },
      {
        key: 'consumerCare',
        label: 'Consumer Care Contact',
        required: true,
        suggestionIfMissing: "Provide consumer care contact details including a toll-free helpline number or email address."
      }
    ]
  },
  'Electronics': {
    category: 'Electronics',
    description: 'Electronic Products & Digital Devices',
    getRules: () => [
      {
        key: 'manufacturerName',
        label: 'Manufacturer / Brand Name',
        required: true,
        suggestionIfMissing: "Declare manufacturer or brand name clearly on the primary packaging or label."
      },
      {
        key: 'mrp',
        label: 'Maximum Retail Price (MRP)',
        required: true,
        mustContainPhrase: 'inclusive of all taxes',
        ruleReference: 'Rule 6(1)(f)',
        suggestionIfMissing: "State MRP inclusive of all taxes prominently on outer carton."
      },
      {
        key: 'netQuantity',
        label: 'Net Quantity / Net Weight',
        required: true,
        suggestionIfMissing: "Specify package contents / piece count (e.g., '1 N', '1 Unit', or net weight)."
      },
      {
        key: 'manufacturerAddress',
        label: 'Manufacturer Address',
        required: false,
        notes: 'Declarable via QR code (optional on-pack under Legal Metrology E-Label Amendment)',
        suggestionIfMissing: "Can be declared via an on-pack scannable QR code linking to verified manufacturer details."
      }
    ]
  },
  'Cosmetics & Personal Care': {
    category: 'Cosmetics & Personal Care',
    description: 'Cosmetics, Skincare & Personal Care Products',
    getRules: (isImported: boolean) => {
      const rules: FieldRule[] = [
        {
          key: 'manufacturerName',
          label: 'Manufacturer Name',
          required: true,
          suggestionIfMissing: "Specify manufacturing entity or marketer clearly on container."
        },
        {
          key: 'mrp',
          label: 'Maximum Retail Price (MRP)',
          required: true,
          mustContainPhrase: 'inclusive of all taxes',
          ruleReference: 'Rule 6(1)(f)',
          suggestionIfMissing: "Add MRP in ₹ with 'inclusive of all taxes'."
        },
        {
          key: 'netQuantity',
          label: 'Net Quantity / Net Weight',
          required: true,
          suggestionIfMissing: "Declare net volume/weight (ml, g) on principal display panel."
        }
      ];

      if (isImported) {
        rules.push({
          key: 'countryOfOrigin',
          label: 'Country of Origin & Importer',
          required: true,
          suggestionIfMissing: "Mandatory for imported goods: state 'Country of Origin: [Country]' and Indian importer name/address."
        });
      }

      return rules;
    }
  },
  'Household & Cleaning Products': {
    category: 'Household & Cleaning Products',
    description: 'Detergents, Cleaners & Disinfectants',
    getRules: () => [
      {
        key: 'manufacturerName',
        label: 'Manufacturer / Packer Name',
        required: true,
        suggestionIfMissing: "Add manufacturer name prefixed with 'Mfg by' or 'Packed by' along with complete address."
      },
      {
        key: 'mrp',
        label: 'Maximum Retail Price (MRP)',
        required: true,
        mustContainPhrase: 'inclusive of all taxes',
        ruleReference: 'Rule 6(1)(f)',
        suggestionIfMissing: "Add MRP in ₹ accompanied by 'inclusive of all taxes'."
      },
      {
        key: 'netQuantity',
        label: 'Net Quantity / Net Weight',
        required: true,
        suggestionIfMissing: "Declare net volume or weight (e.g. 500 ml, 1 L, 1 kg) in standard font height."
      },
      {
        key: 'mfgDate',
        label: 'Date of Manufacture / Packaging',
        required: true,
        suggestionIfMissing: "State Month and Year of manufacture or packing (e.g., 'Mfg Date: 08/2026')."
      },
      {
        key: 'consumerCare',
        label: 'Consumer Care Helpline',
        required: true,
        suggestionIfMissing: "Provide consumer care contact helpline phone number or email address."
      }
    ]
  },
  'Toys & Stationery': {
    category: 'Toys & Stationery',
    description: 'Toys, Games, Educational Kits & Stationery Goods',
    getRules: (isImported: boolean) => {
      const rules: FieldRule[] = [
        {
          key: 'manufacturerName',
          label: 'Manufacturer / Brand Name',
          required: true,
          suggestionIfMissing: "Specify manufacturer or brand entity name prominently."
        },
        {
          key: 'mrp',
          label: 'Maximum Retail Price (MRP)',
          required: true,
          mustContainPhrase: 'inclusive of all taxes',
          ruleReference: 'Rule 6(1)(f)',
          suggestionIfMissing: "State MRP inclusive of all taxes clearly on retail packaging."
        },
        {
          key: 'netQuantity',
          label: 'Net Quantity / Net Weight',
          required: true,
          suggestionIfMissing: "Declare piece count (e.g., '1 N', '1 Set', '10 Units') or net weight."
        },
        {
          key: 'consumerCare',
          label: 'Consumer Care Contact',
          required: true,
          suggestionIfMissing: "Mention consumer contact helpline or email on package."
        }
      ];

      if (isImported) {
        rules.push({
          key: 'countryOfOrigin',
          label: 'Country of Origin & Importer',
          required: true,
          suggestionIfMissing: "Mandatory for imported toys & stationery: specify 'Country of Origin: [Country]' and Indian importer."
        });
      }

      return rules;
    }
  }
};
