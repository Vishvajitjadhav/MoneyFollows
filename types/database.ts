/**
 * Supabase database types — mirrors database/migrations/*.sql.
 * Hand-maintained in the generated-types shape (`supabase gen types typescript`);
 * regenerate with the CLI when available and keep the helper exports at the bottom.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Timestamps = { created_at: string; updated_at: string };

/** Build Insert/Update from Row: `Req` keys are required on insert, the rest optional. */
type Table<Row, Req extends keyof Row, Rel extends Relationship[] = []> = {
  Row: Row;
  Insert: Pick<Row, Req> & Partial<Omit<Row, Req>>;
  Update: Partial<Row>;
  Relationships: Rel;
};

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type TransactionType = "EXPENSE" | "INCOME" | "INVESTMENT";
type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
type InvestmentType = "SIP" | "MUTUAL_FUND" | "STOCKS" | "PPF" | "FD" | "OTHER";
type InvestmentFrequency = "ONE_TIME" | "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
type CustomFieldType = "TEXT" | "NUMBER" | "DROPDOWN" | "BOOLEAN" | "DATE";

type CategoryRel = {
  foreignKeyName: string;
  columns: ["category_id", "user_id", "type"];
  isOneToOne: false;
  referencedRelation: "categories";
  referencedColumns: ["id", "user_id", "type"];
};
type SubcategoryRel = {
  foreignKeyName: string;
  columns: ["subcategory_id", "user_id", "category_id"];
  isOneToOne: false;
  referencedRelation: "subcategories";
  referencedColumns: ["id", "user_id", "category_id"];
};

/** Row returned by find_transactions(): one page + totals of the whole filtered set. */
export type FoundTransaction = {
  id: string;
  type: TransactionType;
  amount: number;
  transaction_date: string;
  description: string | null;
  notes: string | null;
  is_purchase: boolean;
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  subcategory_id: string | null;
  subcategory_name: string | null;
  created_at: string;
  total_count: number;
  total_expense: number;
  total_income: number;
  total_investment: number;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        { id: string; full_name: string | null; currency: string } & Timestamps,
        "id"
      >;
      categories: Table<
        {
          id: string;
          user_id: string;
          type: TransactionType;
          name: string;
          icon: string;
          color: string;
          sort_order: number;
          is_system: boolean;
          archived_at: string | null;
        } & Timestamps,
        "type" | "name"
      >;
      subcategories: Table<
        {
          id: string;
          user_id: string;
          category_id: string;
          name: string;
          sort_order: number;
          archived_at: string | null;
        } & Timestamps,
        "category_id" | "name",
        [
          {
            foreignKeyName: "subcategories_category_id_user_id_fkey";
            columns: ["category_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id", "user_id"];
          },
        ]
      >;
      investments: Table<
        {
          id: string;
          user_id: string;
          name: string;
          type: InvestmentType;
          amount: number;
          frequency: InvestmentFrequency;
          start_date: string;
          end_date: string | null;
          notes: string | null;
          active: boolean;
        } & Timestamps,
        "name" | "type" | "amount"
      >;
      recurring_transactions: Table<
        {
          id: string;
          user_id: string;
          type: TransactionType;
          amount: number;
          category_id: string;
          subcategory_id: string | null;
          description: string | null;
          frequency: RecurrenceFrequency;
          start_date: string;
          end_date: string | null;
          next_run_date: string;
          is_purchase: boolean;
          investment_id: string | null;
          active: boolean;
        } & Timestamps,
        "type" | "amount" | "category_id" | "frequency" | "start_date" | "next_run_date",
        [
          CategoryRel & { foreignKeyName: "recurring_transactions_category_id_user_id_type_fkey" },
          SubcategoryRel & { foreignKeyName: "recurring_transactions_subcategory_id_user_id_category_id_fkey" },
        ]
      >;
      transactions: Table<
        {
          id: string;
          user_id: string;
          type: TransactionType;
          amount: number;
          category_id: string;
          subcategory_id: string | null;
          transaction_date: string;
          description: string | null;
          notes: string | null;
          custom_metadata: Json;
          is_purchase: boolean;
          recurring_id: string | null;
          investment_id: string | null;
        } & Timestamps,
        "type" | "amount" | "category_id",
        [
          CategoryRel & { foreignKeyName: "transactions_category_id_user_id_type_fkey" },
          SubcategoryRel & { foreignKeyName: "transactions_subcategory_id_user_id_category_id_fkey" },
          {
            foreignKeyName: "transactions_recurring_id_user_id_fkey";
            columns: ["recurring_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "recurring_transactions";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "transactions_investment_id_user_id_fkey";
            columns: ["investment_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "investments";
            referencedColumns: ["id", "user_id"];
          },
        ]
      >;
      custom_field_definitions: Table<
        {
          id: string;
          user_id: string;
          name: string;
          field_type: CustomFieldType;
          options: Json;
          sort_order: number;
          archived_at: string | null;
        } & Timestamps,
        "name" | "field_type"
      >;
      transaction_custom_fields: Table<
        { transaction_id: string; field_id: string; user_id: string; value: Json } & Timestamps,
        "transaction_id" | "field_id" | "value",
        [
          {
            foreignKeyName: "transaction_custom_fields_transaction_id_user_id_fkey";
            columns: ["transaction_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "transaction_custom_fields_field_id_user_id_fkey";
            columns: ["field_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "custom_field_definitions";
            referencedColumns: ["id", "user_id"];
          },
        ]
      >;
      budgets: Table<
        { id: string; user_id: string; category_id: string; month: string; amount: number } & Timestamps,
        "category_id" | "month" | "amount",
        [
          {
            foreignKeyName: "budgets_category_id_user_id_fkey";
            columns: ["category_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id", "user_id"];
          },
        ]
      >;
      financial_goals: Table<
        {
          id: string;
          user_id: string;
          name: string;
          target_amount: number;
          current_amount: number;
          target_date: string | null;
          icon: string;
          color: string;
          achieved_at: string | null;
        } & Timestamps,
        "name" | "target_amount"
      >;
      monthly_plans: Table<
        {
          id: string;
          user_id: string;
          month: string;
          monthly_income: number;
          inputs: Json;
          allocations: Json;
        } & Timestamps,
        "month"
      >;
    };
    Views: { [_ in never]: never };
    Functions: {
      period_summary: {
        Args: { p_from: string; p_to: string };
        Returns: { type: TransactionType; total: number; count: number }[];
      };
      category_totals: {
        Args: { p_from: string; p_to: string; p_type?: TransactionType; p_purchase_only?: boolean };
        Returns: { category_id: string; name: string; icon: string; color: string; total: number; count: number }[];
      };
      subcategory_totals: {
        Args: { p_category_id: string; p_from: string; p_to: string };
        Returns: { subcategory_id: string | null; name: string; total: number; count: number }[];
      };
      daily_totals: {
        Args: { p_from: string; p_to: string; p_type?: TransactionType };
        Returns: { day: string; total: number; count: number }[];
      };
      monthly_totals: {
        Args: { p_from: string; p_to: string };
        Returns: { month: string; income: number; expense: number; investment: number }[];
      };
      find_transactions: {
        Args: {
          p_query?: string | null;
          p_from?: string | null;
          p_to?: string | null;
          p_type?: TransactionType | null;
          p_category_id?: string | null;
          p_subcategory_id?: string | null;
          p_min?: number | null;
          p_max?: number | null;
          p_purchase_only?: boolean;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: FoundTransaction[];
      };
      recurrence_next: {
        Args: { p_start: string; p_after: string; p_frequency: RecurrenceFrequency };
        Returns: string;
      };
      generate_recurring_transactions: {
        Args: { p_today?: string };
        Returns: number;
      };
    };
    Enums: {
      transaction_type: TransactionType;
      recurrence_frequency: RecurrenceFrequency;
      investment_type: InvestmentType;
      investment_frequency: InvestmentFrequency;
      custom_field_type: CustomFieldType;
    };
    CompositeTypes: { [_ in never]: never };
  };
};

// ─── Convenience helpers ─────────────────────────────────────────────
type PublicSchema = Database["public"];
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
