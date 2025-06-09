export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      brokers: {
        Row: {
          address: string | null
          broker_code: string
          contact_info: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          broker_code: string
          contact_info?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          broker_code?: string
          contact_info?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string | null
          description: string | null
          exchange_listed: string | null
          headquarters_location: string | null
          id: string
          incorporation_date: string | null
          industry: string | null
          is_active: boolean | null
          name: string
          scraped_at: string | null
          sector_name: string | null
          ticker_symbol: string
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          exchange_listed?: string | null
          headquarters_location?: string | null
          id?: string
          incorporation_date?: string | null
          industry?: string | null
          is_active?: boolean | null
          name: string
          scraped_at?: string | null
          sector_name?: string | null
          ticker_symbol: string
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          exchange_listed?: string | null
          headquarters_location?: string | null
          id?: string
          incorporation_date?: string | null
          industry?: string | null
          is_active?: boolean | null
          name?: string
          scraped_at?: string | null
          sector_name?: string | null
          ticker_symbol?: string
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      company_ownership_governance: {
        Row: {
          as_of_date: string
          board_composition_details: Json | null
          company_id: string
          created_at: string | null
          foreign_holdings_percent: number | null
          government_holdings_percent: number | null
          id: string
          institutional_holdings_percent: number | null
          promoter_holdings_percent: number | null
          public_shareholding_percent: number | null
          scraped_at: string | null
          total_outstanding_shares: number | null
          updated_at: string | null
        }
        Insert: {
          as_of_date: string
          board_composition_details?: Json | null
          company_id: string
          created_at?: string | null
          foreign_holdings_percent?: number | null
          government_holdings_percent?: number | null
          id?: string
          institutional_holdings_percent?: number | null
          promoter_holdings_percent?: number | null
          public_shareholding_percent?: number | null
          scraped_at?: string | null
          total_outstanding_shares?: number | null
          updated_at?: string | null
        }
        Update: {
          as_of_date?: string
          board_composition_details?: Json | null
          company_id?: string
          created_at?: string | null
          foreign_holdings_percent?: number | null
          government_holdings_percent?: number | null
          id?: string
          institutional_holdings_percent?: number | null
          promoter_holdings_percent?: number | null
          public_shareholding_percent?: number | null
          scraped_at?: string | null
          total_outstanding_shares?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_ownership_governance_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_ratios: {
        Row: {
          as_of_date: string
          company_id: string
          created_at: string | null
          current_ratio: number | null
          debt_to_equity_ratio: number | null
          dividend_yield: number | null
          interest_coverage_ratio: number | null
          net_profit_margin: number | null
          pb_ratio: number | null
          pe_ratio: number | null
          ps_ratio: number | null
          quick_ratio: number | null
          ratio_id: string
          report_id: string | null
          roa: number | null
          roe: number | null
          scraped_at: string | null
          updated_at: string | null
        }
        Insert: {
          as_of_date: string
          company_id: string
          created_at?: string | null
          current_ratio?: number | null
          debt_to_equity_ratio?: number | null
          dividend_yield?: number | null
          interest_coverage_ratio?: number | null
          net_profit_margin?: number | null
          pb_ratio?: number | null
          pe_ratio?: number | null
          ps_ratio?: number | null
          quick_ratio?: number | null
          ratio_id?: string
          report_id?: string | null
          roa?: number | null
          roe?: number | null
          scraped_at?: string | null
          updated_at?: string | null
        }
        Update: {
          as_of_date?: string
          company_id?: string
          created_at?: string | null
          current_ratio?: number | null
          debt_to_equity_ratio?: number | null
          dividend_yield?: number | null
          interest_coverage_ratio?: number | null
          net_profit_margin?: number | null
          pb_ratio?: number | null
          pe_ratio?: number | null
          ps_ratio?: number | null
          quick_ratio?: number | null
          ratio_id?: string
          report_id?: string | null
          roa?: number | null
          roe?: number | null
          scraped_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_ratios_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_ratios_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "financial_reports"
            referencedColumns: ["report_id"]
          },
        ]
      }
      company_risk_factors: {
        Row: {
          as_of_date: string
          beta: number | null
          company_id: string
          created_at: string | null
          credit_rating_agency: string | null
          credit_rating_date: string | null
          credit_rating_value: string | null
          id: string
          litigation_summary: string | null
          other_risk_factors: Json | null
          scraped_at: string | null
          updated_at: string | null
        }
        Insert: {
          as_of_date: string
          beta?: number | null
          company_id: string
          created_at?: string | null
          credit_rating_agency?: string | null
          credit_rating_date?: string | null
          credit_rating_value?: string | null
          id?: string
          litigation_summary?: string | null
          other_risk_factors?: Json | null
          scraped_at?: string | null
          updated_at?: string | null
        }
        Update: {
          as_of_date?: string
          beta?: number | null
          company_id?: string
          created_at?: string | null
          credit_rating_agency?: string | null
          credit_rating_date?: string | null
          credit_rating_value?: string | null
          id?: string
          litigation_summary?: string | null
          other_risk_factors?: Json | null
          scraped_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_risk_factors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_index_values: {
        Row: {
          close_value: number | null
          created_at: string | null
          high_value: number | null
          id: string
          index_id: string
          low_value: number | null
          open_value: number | null
          percent_change: number | null
          point_change: number | null
          scraped_at: string | null
          trade_date: string
        }
        Insert: {
          close_value?: number | null
          created_at?: string | null
          high_value?: number | null
          id?: string
          index_id: string
          low_value?: number | null
          open_value?: number | null
          percent_change?: number | null
          point_change?: number | null
          scraped_at?: string | null
          trade_date: string
        }
        Update: {
          close_value?: number | null
          created_at?: string | null
          high_value?: number | null
          id?: string
          index_id?: string
          low_value?: number | null
          open_value?: number | null
          percent_change?: number | null
          point_change?: number | null
          scraped_at?: string | null
          trade_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_index_values_index_id_fkey"
            columns: ["index_id"]
            isOneToOne: false
            referencedRelation: "nepse_indices"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_market_data: {
        Row: {
          adjusted_close_price: number | null
          close_price: number | null
          company_id: string
          created_at: string | null
          fifty_two_week_high: number | null
          fifty_two_week_low: number | null
          high_price: number | null
          id: string
          low_price: number | null
          market_cap: number | null
          open_price: number | null
          percent_change: number | null
          previous_close_price: number | null
          price_change: number | null
          scraped_at: string | null
          trade_date: string
          turnover: number | null
          updated_at: string | null
          volume: number | null
        }
        Insert: {
          adjusted_close_price?: number | null
          close_price?: number | null
          company_id: string
          created_at?: string | null
          fifty_two_week_high?: number | null
          fifty_two_week_low?: number | null
          high_price?: number | null
          id?: string
          low_price?: number | null
          market_cap?: number | null
          open_price?: number | null
          percent_change?: number | null
          previous_close_price?: number | null
          price_change?: number | null
          scraped_at?: string | null
          trade_date: string
          turnover?: number | null
          updated_at?: string | null
          volume?: number | null
        }
        Update: {
          adjusted_close_price?: number | null
          close_price?: number | null
          company_id?: string
          created_at?: string | null
          fifty_two_week_high?: number | null
          fifty_two_week_low?: number | null
          high_price?: number | null
          id?: string
          low_price?: number | null
          market_cap?: number | null
          open_price?: number | null
          percent_change?: number | null
          previous_close_price?: number | null
          price_change?: number | null
          scraped_at?: string | null
          trade_date?: string
          turnover?: number | null
          updated_at?: string | null
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_market_data_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_technical_indicators: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          indicator_name: string
          parameters: Json | null
          scraped_at: string | null
          trade_date: string
          value: number | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          indicator_name: string
          parameters?: Json | null
          scraped_at?: string | null
          trade_date: string
          value?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          indicator_name?: string
          parameters?: Json | null
          scraped_at?: string | null
          trade_date?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_technical_indicators_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      dividend_history: {
        Row: {
          amount_per_share: number | null
          bonus_share_ratio: string | null
          book_closure_date_end: string | null
          book_closure_date_start: string | null
          company_id: string
          created_at: string | null
          dividend_type: string
          ex_dividend_date: string
          fiscal_year_of_profit: string | null
          id: string
          payment_date: string | null
          record_date: string | null
          scraped_at: string | null
          source_announcement_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount_per_share?: number | null
          bonus_share_ratio?: string | null
          book_closure_date_end?: string | null
          book_closure_date_start?: string | null
          company_id: string
          created_at?: string | null
          dividend_type: string
          ex_dividend_date: string
          fiscal_year_of_profit?: string | null
          id?: string
          payment_date?: string | null
          record_date?: string | null
          scraped_at?: string | null
          source_announcement_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_per_share?: number | null
          bonus_share_ratio?: string | null
          book_closure_date_end?: string | null
          book_closure_date_start?: string | null
          company_id?: string
          created_at?: string | null
          dividend_type?: string
          ex_dividend_date?: string
          fiscal_year_of_profit?: string | null
          id?: string
          payment_date?: string | null
          record_date?: string | null
          scraped_at?: string | null
          source_announcement_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dividend_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dividend_history_source_announcement_id_fkey"
            columns: ["source_announcement_id"]
            isOneToOne: false
            referencedRelation: "news_and_events"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_reports: {
        Row: {
          cash_and_equivalents: number | null
          company_id: string
          created_at: string | null
          current_assets: number | null
          current_liabilities: number | null
          dps: number | null
          eps: number | null
          financing_cash_flow: number | null
          fiscal_period: string
          fiscal_year: number
          free_cash_flow: number | null
          gross_profit: number | null
          investing_cash_flow: number | null
          long_term_debt: number | null
          net_income: number | null
          operating_cash_flow: number | null
          operating_income: number | null
          report_date: string
          report_id: string
          revenue: number | null
          scraped_at: string | null
          shareholders_equity: number | null
          source_url: string | null
          total_assets: number | null
          total_liabilities: number | null
          updated_at: string | null
        }
        Insert: {
          cash_and_equivalents?: number | null
          company_id: string
          created_at?: string | null
          current_assets?: number | null
          current_liabilities?: number | null
          dps?: number | null
          eps?: number | null
          financing_cash_flow?: number | null
          fiscal_period: string
          fiscal_year: number
          free_cash_flow?: number | null
          gross_profit?: number | null
          investing_cash_flow?: number | null
          long_term_debt?: number | null
          net_income?: number | null
          operating_cash_flow?: number | null
          operating_income?: number | null
          report_date: string
          report_id?: string
          revenue?: number | null
          scraped_at?: string | null
          shareholders_equity?: number | null
          source_url?: string | null
          total_assets?: number | null
          total_liabilities?: number | null
          updated_at?: string | null
        }
        Update: {
          cash_and_equivalents?: number | null
          company_id?: string
          created_at?: string | null
          current_assets?: number | null
          current_liabilities?: number | null
          dps?: number | null
          eps?: number | null
          financing_cash_flow?: number | null
          fiscal_period?: string
          fiscal_year?: number
          free_cash_flow?: number | null
          gross_profit?: number | null
          investing_cash_flow?: number | null
          long_term_debt?: number | null
          net_income?: number | null
          operating_cash_flow?: number | null
          operating_income?: number | null
          report_date?: string
          report_id?: string
          revenue?: number | null
          scraped_at?: string | null
          shareholders_equity?: number | null
          source_url?: string | null
          total_assets?: number | null
          total_liabilities?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      floor_sheet_transactions: {
        Row: {
          amount: number
          buyer_broker_id: string | null
          company_id: string
          contract_number: string | null
          created_at: string | null
          id: string
          nepse_transaction_id: number | null
          quantity: number
          rate: number
          scraped_at: string | null
          seller_broker_id: string | null
          trade_date: string
          transaction_time: string | null
        }
        Insert: {
          amount: number
          buyer_broker_id?: string | null
          company_id: string
          contract_number?: string | null
          created_at?: string | null
          id?: string
          nepse_transaction_id?: number | null
          quantity: number
          rate: number
          scraped_at?: string | null
          seller_broker_id?: string | null
          trade_date: string
          transaction_time?: string | null
        }
        Update: {
          amount?: number
          buyer_broker_id?: string | null
          company_id?: string
          contract_number?: string | null
          created_at?: string | null
          id?: string
          nepse_transaction_id?: number | null
          quantity?: number
          rate?: number
          scraped_at?: string | null
          seller_broker_id?: string | null
          trade_date?: string
          transaction_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "floor_sheet_transactions_buyer_broker_id_fkey"
            columns: ["buyer_broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "floor_sheet_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "floor_sheet_transactions_seller_broker_id_fkey"
            columns: ["seller_broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      market_overall_summary: {
        Row: {
          created_at: string | null
          float_index_value: number | null
          float_percent_change: number | null
          float_point_change: number | null
          id: string
          nepse_index_value: number | null
          nepse_percent_change: number | null
          nepse_point_change: number | null
          scraped_at: string | null
          sensitive_float_index_value: number | null
          sensitive_float_percent_change: number | null
          sensitive_float_point_change: number | null
          sensitive_index_value: number | null
          sensitive_percent_change: number | null
          sensitive_point_change: number | null
          summary_date: string
          total_market_cap: number | null
          total_traded_shares: number | null
          total_transactions: number | null
          total_turnover: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          float_index_value?: number | null
          float_percent_change?: number | null
          float_point_change?: number | null
          id?: string
          nepse_index_value?: number | null
          nepse_percent_change?: number | null
          nepse_point_change?: number | null
          scraped_at?: string | null
          sensitive_float_index_value?: number | null
          sensitive_float_percent_change?: number | null
          sensitive_float_point_change?: number | null
          sensitive_index_value?: number | null
          sensitive_percent_change?: number | null
          sensitive_point_change?: number | null
          summary_date: string
          total_market_cap?: number | null
          total_traded_shares?: number | null
          total_transactions?: number | null
          total_turnover?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          float_index_value?: number | null
          float_percent_change?: number | null
          float_point_change?: number | null
          id?: string
          nepse_index_value?: number | null
          nepse_percent_change?: number | null
          nepse_point_change?: number | null
          scraped_at?: string | null
          sensitive_float_index_value?: number | null
          sensitive_float_percent_change?: number | null
          sensitive_float_point_change?: number | null
          sensitive_index_value?: number | null
          sensitive_percent_change?: number | null
          sensitive_point_change?: number | null
          summary_date?: string
          total_market_cap?: number | null
          total_traded_shares?: number | null
          total_transactions?: number | null
          total_turnover?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      nepal_economic_data: {
        Row: {
          central_bank_policy_rate: number | null
          created_at: string | null
          data_date: string
          gdp_growth_rate: number | null
          id: string
          inflation_rate_cpi: number | null
          npr_inr_exchange_rate: number | null
          npr_usd_exchange_rate: number | null
          scraped_at: string | null
          source: string | null
          updated_at: string | null
        }
        Insert: {
          central_bank_policy_rate?: number | null
          created_at?: string | null
          data_date: string
          gdp_growth_rate?: number | null
          id?: string
          inflation_rate_cpi?: number | null
          npr_inr_exchange_rate?: number | null
          npr_usd_exchange_rate?: number | null
          scraped_at?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          central_bank_policy_rate?: number | null
          created_at?: string | null
          data_date?: string
          gdp_growth_rate?: number | null
          id?: string
          inflation_rate_cpi?: number | null
          npr_inr_exchange_rate?: number | null
          npr_usd_exchange_rate?: number | null
          scraped_at?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      nepse_indices: {
        Row: {
          base_date: string | null
          base_value: number | null
          created_at: string | null
          description: string | null
          id: string
          index_code: string
          name: string
          updated_at: string | null
        }
        Insert: {
          base_date?: string | null
          base_value?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          index_code: string
          name: string
          updated_at?: string | null
        }
        Update: {
          base_date?: string | null
          base_value?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          index_code?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      news_and_events: {
        Row: {
          company_id: string | null
          content: string | null
          created_at: string | null
          details_json: Json | null
          event_date: string
          event_type: string | null
          headline: string
          id: string
          publish_datetime: string | null
          scraped_at: string | null
          sentiment_score: number | null
          source_name: string | null
          summary: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          company_id?: string | null
          content?: string | null
          created_at?: string | null
          details_json?: Json | null
          event_date: string
          event_type?: string | null
          headline: string
          id?: string
          publish_datetime?: string | null
          scraped_at?: string | null
          sentiment_score?: number | null
          source_name?: string | null
          summary?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          company_id?: string | null
          content?: string | null
          created_at?: string | null
          details_json?: Json | null
          event_date?: string
          event_type?: string | null
          headline?: string
          id?: string
          publish_datetime?: string | null
          scraped_at?: string | null
          sentiment_score?: number | null
          source_name?: string | null
          summary?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_and_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      scraping_checkpoints: {
        Row: {
          created_at: string | null
          id: string
          last_scraped_value: string | null
          last_successful_run: string | null
          notes: string | null
          source_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_scraped_value?: string | null
          last_successful_run?: string | null
          notes?: string | null
          source_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_scraped_value?: string | null
          last_successful_run?: string | null
          notes?: string | null
          source_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sector_daily_summary: {
        Row: {
          created_at: string | null
          id: string
          index_value: number | null
          meta_data: Json | null
          percent_change: number | null
          scraped_at: string | null
          sector_name: string
          total_turnover: number | null
          total_volume: number | null
          trade_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          index_value?: number | null
          meta_data?: Json | null
          percent_change?: number | null
          scraped_at?: string | null
          sector_name: string
          total_turnover?: number | null
          total_volume?: number | null
          trade_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          index_value?: number | null
          meta_data?: Json | null
          percent_change?: number | null
          scraped_at?: string | null
          sector_name?: string
          total_turnover?: number | null
          total_volume?: number | null
          trade_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      stock_splits: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          scraped_at: string | null
          source_announcement_id: string | null
          split_date: string
          split_ratio_from: number
          split_ratio_to: number
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          scraped_at?: string | null
          source_announcement_id?: string | null
          split_date: string
          split_ratio_from: number
          split_ratio_to: number
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          scraped_at?: string | null
          source_announcement_id?: string | null
          split_date?: string
          split_ratio_from?: number
          split_ratio_to?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_splits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_splits_source_announcement_id_fkey"
            columns: ["source_announcement_id"]
            isOneToOne: false
            referencedRelation: "news_and_events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const