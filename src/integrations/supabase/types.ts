export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      animal_attachments: {
        Row: {
          animal_id: string
          animal_type: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
        }
        Insert: {
          animal_id: string
          animal_type: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
        }
        Update: {
          animal_id?: string
          animal_type?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
        }
        Relationships: []
      }
      bird_species_catalog: {
        Row: {
          created_at: string
          id: string
          nombre_comun: string
          nombre_especie: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre_comun: string
          nombre_especie: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre_comun?: string
          nombre_especie?: string
        }
        Relationships: []
      }
      birds: {
        Row: {
          anilla: string | null
          comentarios: string | null
          comprador_id: string | null
          comprador_texto: string | null
          created_at: string
          especie: Database["public"]["Enums"]["bird_species"]
          especie_id: string | null
          fecha_cesion: string | null
          fecha_muerte: string | null
          fecha_nacimiento: string
          id: string
          id_miteco: string | null
          madre_externa: string | null
          madre_id: string | null
          microchip: string | null
          numero_cites: string | null
          padre_externo: string | null
          padre_id: string | null
          pareja_id: string | null
          sexo: Database["public"]["Enums"]["animal_sex"]
          updated_at: string
          zona: string | null
        }
        Insert: {
          anilla?: string | null
          comentarios?: string | null
          comprador_id?: string | null
          comprador_texto?: string | null
          created_at?: string
          especie: Database["public"]["Enums"]["bird_species"]
          especie_id?: string | null
          fecha_cesion?: string | null
          fecha_muerte?: string | null
          fecha_nacimiento: string
          id?: string
          id_miteco?: string | null
          madre_externa?: string | null
          madre_id?: string | null
          microchip?: string | null
          numero_cites?: string | null
          padre_externo?: string | null
          padre_id?: string | null
          pareja_id?: string | null
          sexo?: Database["public"]["Enums"]["animal_sex"]
          updated_at?: string
          zona?: string | null
        }
        Update: {
          anilla?: string | null
          comentarios?: string | null
          comprador_id?: string | null
          comprador_texto?: string | null
          created_at?: string
          especie?: Database["public"]["Enums"]["bird_species"]
          especie_id?: string | null
          fecha_cesion?: string | null
          fecha_muerte?: string | null
          fecha_nacimiento?: string
          id?: string
          id_miteco?: string | null
          madre_externa?: string | null
          madre_id?: string | null
          microchip?: string | null
          numero_cites?: string | null
          padre_externo?: string | null
          padre_id?: string | null
          pareja_id?: string | null
          sexo?: Database["public"]["Enums"]["animal_sex"]
          updated_at?: string
          zona?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "birds_comprador_id_fkey"
            columns: ["comprador_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birds_especie_id_fkey"
            columns: ["especie_id"]
            isOneToOne: false
            referencedRelation: "bird_species_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birds_madre_id_fkey"
            columns: ["madre_id"]
            isOneToOne: false
            referencedRelation: "birds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birds_padre_id_fkey"
            columns: ["padre_id"]
            isOneToOne: false
            referencedRelation: "birds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birds_pareja_id_fkey"
            columns: ["pareja_id"]
            isOneToOne: false
            referencedRelation: "birds"
            referencedColumns: ["id"]
          },
        ]
      }
      buyers: {
        Row: {
          apellidos: string
          created_at: string
          dni: string
          domicilio: string
          id: string
          nombre: string
          recurrente: boolean
        }
        Insert: {
          apellidos: string
          created_at?: string
          dni: string
          domicilio: string
          id?: string
          nombre: string
          recurrente?: boolean
        }
        Update: {
          apellidos?: string
          created_at?: string
          dni?: string
          domicilio?: string
          id?: string
          nombre?: string
          recurrente?: boolean
        }
        Relationships: []
      }
      cession_templates: {
        Row: {
          animal_type: string
          created_at: string
          group_key: string
          id: string
          template_content: string
          updated_at: string
        }
        Insert: {
          animal_type: string
          created_at?: string
          group_key: string
          id?: string
          template_content?: string
          updated_at?: string
        }
        Update: {
          animal_type?: string
          created_at?: string
          group_key?: string
          id?: string
          template_content?: string
          updated_at?: string
        }
        Relationships: []
      }
      cessions: {
        Row: {
          animal_id: string
          animal_type: Database["public"]["Enums"]["animal_type"]
          buyer_id: string
          created_at: string
          fecha_cesion: string
          id: string
          pdf_ref: string | null
          precio: number
        }
        Insert: {
          animal_id: string
          animal_type: Database["public"]["Enums"]["animal_type"]
          buyer_id: string
          created_at?: string
          fecha_cesion?: string
          id?: string
          pdf_ref?: string | null
          precio: number
        }
        Update: {
          animal_id?: string
          animal_type?: Database["public"]["Enums"]["animal_type"]
          buyer_id?: string
          created_at?: string
          fecha_cesion?: string
          id?: string
          pdf_ref?: string | null
          precio?: number
        }
        Relationships: [
          {
            foreignKeyName: "cessions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          animal_type: string
          categoria: string
          created_at: string
          descripcion: string | null
          fecha: string
          id: string
          monto: number
          subcategoria: string | null
        }
        Insert: {
          animal_type: string
          categoria: string
          created_at?: string
          descripcion?: string | null
          fecha?: string
          id?: string
          monto: number
          subcategoria?: string | null
        }
        Update: {
          animal_type?: string
          categoria?: string
          created_at?: string
          descripcion?: string | null
          fecha?: string
          id?: string
          monto?: number
          subcategoria?: string | null
        }
        Relationships: []
      }
      map_folders: {
        Row: {
          collapsed: boolean
          color: string
          created_at: string
          height: number
          id: string
          nombre: string
          width: number
          x: number
          y: number
        }
        Insert: {
          collapsed?: boolean
          color?: string
          created_at?: string
          height?: number
          id?: string
          nombre: string
          width?: number
          x?: number
          y?: number
        }
        Update: {
          collapsed?: boolean
          color?: string
          created_at?: string
          height?: number
          id?: string
          nombre?: string
          width?: number
          x?: number
          y?: number
        }
        Relationships: []
      }
      map_zones: {
        Row: {
          color: string
          created_at: string
          folder_id: string | null
          height: number
          id: string
          nombre: string
          width: number
          x: number
          y: number
        }
        Insert: {
          color?: string
          created_at?: string
          folder_id?: string | null
          height?: number
          id?: string
          nombre: string
          width?: number
          x?: number
          y?: number
        }
        Update: {
          color?: string
          created_at?: string
          folder_id?: string | null
          height?: number
          id?: string
          nombre?: string
          width?: number
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "map_zones_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "map_folders"
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
      animal_sex: "Macho" | "Hembra" | "Desconocido"
      animal_type: "bird" | "dog"
      bird_species:
        | "Guacamayo"
        | "Lori"
        | "Ninfa"
        | "Yaco"
        | "Cacatua"
        | "Pirrura"
        | "Amazona"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      animal_sex: ["Macho", "Hembra", "Desconocido"],
      animal_type: ["bird", "dog"],
      bird_species: [
        "Guacamayo",
        "Lori",
        "Ninfa",
        "Yaco",
        "Cacatua",
        "Pirrura",
        "Amazona",
      ],
    },
  },
} as const
