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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admins_autorizados: {
        Row: {
          creado_en: string
          email: string
        }
        Insert: {
          creado_en?: string
          email: string
        }
        Update: {
          creado_en?: string
          email?: string
        }
        Relationships: []
      }
      contratos_aceptados: {
        Row: {
          aceptado_en: string
          id: string
          tipo: string
          user_id: string
          version: string
        }
        Insert: {
          aceptado_en?: string
          id?: string
          tipo: string
          user_id: string
          version?: string
        }
        Update: {
          aceptado_en?: string
          id?: string
          tipo?: string
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      datos_bancarios: {
        Row: {
          activo: boolean
          banco: string
          creado_en: string
          id: string
          identificacion: string
          numero_cuenta: string
          tipo_cuenta: string
          titular: string
        }
        Insert: {
          activo?: boolean
          banco: string
          creado_en?: string
          id?: string
          identificacion: string
          numero_cuenta: string
          tipo_cuenta: string
          titular: string
        }
        Update: {
          activo?: boolean
          banco?: string
          creado_en?: string
          id?: string
          identificacion?: string
          numero_cuenta?: string
          tipo_cuenta?: string
          titular?: string
        }
        Relationships: []
      }
      lista_negra: {
        Row: {
          cedula: string | null
          creado_en: string
          creado_por: string | null
          email: string | null
          id: string
          motivo: string
          telefono: string | null
          user_id: string | null
        }
        Insert: {
          cedula?: string | null
          creado_en?: string
          creado_por?: string | null
          email?: string | null
          id?: string
          motivo?: string
          telefono?: string | null
          user_id?: string | null
        }
        Update: {
          cedula?: string | null
          creado_en?: string
          creado_por?: string | null
          email?: string | null
          id?: string
          motivo?: string
          telefono?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cedula: string | null
          creado_en: string
          cv_nombre: string | null
          cv_ruta: string | null
          cv_subido_en: string | null
          estado: Database["public"]["Enums"]["estado_perfil"]
          id: string
          nombre_completo: string
          telefono: string | null
          zona: string | null
        }
        Insert: {
          cedula?: string | null
          creado_en?: string
          cv_nombre?: string | null
          cv_ruta?: string | null
          cv_subido_en?: string | null
          estado?: Database["public"]["Enums"]["estado_perfil"]
          id: string
          nombre_completo?: string
          telefono?: string | null
          zona?: string | null
        }
        Update: {
          cedula?: string | null
          creado_en?: string
          cv_nombre?: string | null
          cv_ruta?: string | null
          cv_subido_en?: string | null
          estado?: Database["public"]["Enums"]["estado_perfil"]
          id?: string
          nombre_completo?: string
          telefono?: string | null
          zona?: string | null
        }
        Relationships: []
      }
      resenas: {
        Row: {
          comentario: string | null
          creado_en: string
          id: string
          puntuacion: number
          puntuacion_app: number | null
          ticket_id: string
        }
        Insert: {
          comentario?: string | null
          creado_en?: string
          id?: string
          puntuacion: number
          puntuacion_app?: number | null
          ticket_id: string
        }
        Update: {
          comentario?: string | null
          creado_en?: string
          id?: string
          puntuacion?: number
          puntuacion_app?: number | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resenas_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "tickets_servicio"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets_servicio: {
        Row: {
          actualizado_en: string
          categoria: string
          cobro_en: string | null
          creado_en: string
          descripcion: string
          estado: Database["public"]["Enums"]["estado_ticket"]
          id: string
          notas_cierre: string | null
          pagado: boolean
          tecnico_id: string | null
          titulo: string
          urgencia: Database["public"]["Enums"]["urgencia_ticket"]
          usuario_id: string
          valor_total: number | null
          zona: string | null
        }
        Insert: {
          actualizado_en?: string
          categoria: string
          cobro_en?: string | null
          creado_en?: string
          descripcion: string
          estado?: Database["public"]["Enums"]["estado_ticket"]
          id?: string
          notas_cierre?: string | null
          pagado?: boolean
          tecnico_id?: string | null
          titulo: string
          urgencia?: Database["public"]["Enums"]["urgencia_ticket"]
          usuario_id: string
          valor_total?: number | null
          zona?: string | null
        }
        Update: {
          actualizado_en?: string
          categoria?: string
          cobro_en?: string | null
          creado_en?: string
          descripcion?: string
          estado?: Database["public"]["Enums"]["estado_ticket"]
          id?: string
          notas_cierre?: string | null
          pagado?: boolean
          tecnico_id?: string | null
          titulo?: string
          urgencia?: Database["public"]["Enums"]["urgencia_ticket"]
          usuario_id?: string
          valor_total?: number | null
          zona?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_servicio_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_servicio_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      banear_tecnico: {
        Args: { _motivo: string; _user_id: string }
        Returns: boolean
      }
      en_lista_negra: {
        Args: { _cedula?: string; _email: string; _telefono?: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      perfil_activo: { Args: { _user_id: string }; Returns: boolean }
      reclamar_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "usuario" | "tecnico" | "admin"
      estado_perfil: "activo" | "pendiente_aprobacion" | "suspendido"
      estado_ticket:
        | "pendiente"
        | "asignado"
        | "en_camino"
        | "en_proceso"
        | "finalizado"
      urgencia_ticket: "baja" | "media" | "alta" | "critica"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["usuario", "tecnico", "admin"],
      estado_perfil: ["activo", "pendiente_aprobacion", "suspendido"],
      estado_ticket: [
        "pendiente",
        "asignado",
        "en_camino",
        "en_proceso",
        "finalizado",
      ],
      urgencia_ticket: ["baja", "media", "alta", "critica"],
    },
  },
} as const
